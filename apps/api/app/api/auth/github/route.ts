import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * GET /api/auth/github - Start GitHub OAuth login flow
 */
export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/github/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
  }

  const state = Buffer.from(JSON.stringify({ type: "login" })).toString("base64");

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "user:email");
  authUrl.searchParams.set("state", state);

  return NextResponse.json({ success: true, authUrl: authUrl.toString() });
}

/**
 * POST /api/auth/github - Exchange code for token and login
 */
export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("GitHub token error:", tokens);
      return NextResponse.json({ error: tokens.error_description || tokens.error }, { status: 400 });
    }

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const githubUser = await userResponse.json();

    // Get user email (may need separate call if private)
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified);
      email = primaryEmail?.email || emails[0]?.email;
    }

    if (!email) {
      return NextResponse.json({ error: "Could not get email from GitHub" }, { status: 400 });
    }

    // Find or create user
    let user = await prismaClient.user.findFirst({
      where: {
        OR: [
          { email },
          { provider: "github", providerId: String(githubUser.id) },
        ],
      },
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          email,
          name: githubUser.name || githubUser.login,
          provider: "github",
          providerId: String(githubUser.id),
          password: null,
        },
      });
      console.log(`✅ Created new user via GitHub: ${user.email}`);
    } else if (!user.provider) {
      user = await prismaClient.user.update({
        where: { id: user.id },
        data: { provider: "github", providerId: String(githubUser.id) },
      });
      console.log(`✅ Linked GitHub to existing user: ${user.email}`);
    }

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
    console.error("GitHub login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
