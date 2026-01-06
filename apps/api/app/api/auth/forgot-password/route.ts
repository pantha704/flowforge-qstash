import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/auth/forgot-password - Send password reset email
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Find user
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent" });
    }

    // Check if user signed up with social login (no password)
    if (user.provider && user.provider !== "email" && !user.password) {
      console.log(`Password reset requested for social login user: ${email}`);
      return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent" });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token
    await prismaClient.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    if (resend) {
      await resend.emails.send({
        from: "FlowForge <onboarding@resend.dev>",
        to: [email],
        subject: "Reset Your Password - FlowForge",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background: #06b6d4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #999; font-size: 12px;">FlowForge - Workflow Automation</p>
          </div>
        `,
      });
      console.log(`✅ Password reset email sent to: ${email}`);
    } else {
      console.log(`⚠️ Resend not configured. Reset URL: ${resetUrl}`);
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
