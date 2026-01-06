import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * GET /api/auth/google/callback - Google OAuth callback
 * Handles the OAuth redirect and creates/logs in user
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const frontendUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${frontendUrl}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${frontendUrl}/login?error=missing_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/google/callback`;

  try {
    // Exchange code for tokens
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
      console.error("Google token error:", tokens);
      return NextResponse.redirect(`${frontendUrl}/login?error=${tokens.error}`);
    }

    // Get user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    // Find or create user
    let user = await prismaClient.user.findFirst({
      where: {
        OR: [
          { email: userInfo.email },
          { provider: "google", providerId: userInfo.id },
        ],
      },
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          provider: "google",
          providerId: userInfo.id,
          password: null,
        },
      });
      console.log(`✅ Created new user via Google: ${user.email}`);
    } else if (!user.provider) {
      user = await prismaClient.user.update({
        where: { id: user.id },
        data: { provider: "google", providerId: userInfo.id },
      });
    }

    // Save Google connection for service access
    await prismaClient.userConnection.upsert({
      where: { userId_provider: { userId: user.id, provider: "google" } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        email: userInfo.email,
      },
      create: {
        userId: user.id,
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        email: userInfo.email,
      },
    });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token
    const userJson = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name }));
    return NextResponse.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userJson}`);
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(`${frontendUrl}/login?error=server_error`);
  }
}
