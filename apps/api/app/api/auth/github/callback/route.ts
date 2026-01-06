import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * GET /api/auth/github/callback - GitHub OAuth callback
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
      return NextResponse.redirect(`${frontendUrl}/login?error=${tokens.error}`);
    }

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const githubUser = await userResponse.json();

    // Get user email
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
      return NextResponse.redirect(`${frontendUrl}/login?error=no_email`);
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
    }

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
    console.error("GitHub callback error:", error);
    return NextResponse.redirect(`${frontendUrl}/login?error=server_error`);
  }
}
