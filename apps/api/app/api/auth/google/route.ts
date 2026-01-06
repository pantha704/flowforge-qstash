import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

/**
 * GET /api/auth/google - Start Google OAuth login flow
 * Returns the Google OAuth authorization URL
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  // State contains "login" to differentiate from service connection OAuth
  const state = Buffer.from(JSON.stringify({ type: "login" })).toString("base64");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  return NextResponse.json({ success: true, authUrl: authUrl.toString() });
}

/**
 * GET /api/auth/google/callback - Google OAuth callback for login
 */
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const frontendUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
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
      console.error("Token exchange error:", tokens);
      return NextResponse.json({ error: tokens.error }, { status: 400 });
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
      // Create new user
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
      // Update existing email user to link Google
      user = await prismaClient.user.update({
        where: { id: user.id },
        data: { provider: "google", providerId: userInfo.id },
      });
      console.log(`✅ Linked Google to existing user: ${user.email}`);
    }

    // Also save/update the Google connection for service access
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

    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
