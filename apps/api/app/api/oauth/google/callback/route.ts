import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/oauth/google/callback - Google OAuth callback
 * Exchanges auth code for tokens and saves to database
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Base URL for redirecting back to frontend
  const frontendUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${frontendUrl}/dashboard?oauth_error=${error}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${frontendUrl}/dashboard?oauth_error=missing_params`);
  }

  // Decode state to get user ID
  let userId: number;
  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    userId = stateData.userId;
  } catch {
    return NextResponse.redirect(`${frontendUrl}/dashboard?oauth_error=invalid_state`);
  }

  // Exchange code for tokens
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/oauth/google/callback`;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("Token exchange error:", tokens);
      return NextResponse.redirect(`${frontendUrl}/dashboard?oauth_error=${tokens.error}`);
    }

    console.log("✅ Google tokens received");

    // Get user info to store email
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    // Calculate expiry
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Upsert connection
    await prismaClient.userConnection.upsert({
      where: { userId_provider: { userId, provider: "google" } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt,
        scope: tokens.scope,
        email: userInfo.email,
      },
      create: {
        userId,
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
        email: userInfo.email,
      },
    });

    console.log(`✅ Google connection saved for user ${userId} (${userInfo.email})`);

    return NextResponse.redirect(`${frontendUrl}/dashboard?oauth_success=google`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${frontendUrl}/dashboard?oauth_error=server_error`);
  }
}
