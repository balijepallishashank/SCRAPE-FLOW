import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { credentialType, value } = body;

    if (!credentialType || !value) {
      return NextResponse.json({ error: "Missing credential type or value" }, { status: 400 });
    }

    // Validate Stripe key
    if (credentialType === "STRIPE") {
      const secretKey = String(value).trim();
      if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
        return NextResponse.json(
          { error: "Invalid Stripe secret key format", valid: false },
          { status: 400 }
        );
      }

      try {
        const response = await fetch("https://api.stripe.com/v1/balance", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        });

        if (response.ok) {
          return NextResponse.json({
            valid: true,
            message: "Stripe key is valid",
            service: "Stripe",
          });
        } else if (response.status === 401) {
          return NextResponse.json(
            { error: "Stripe key is invalid or expired", valid: false },
            { status: 401 }
          );
        } else {
          return NextResponse.json(
            { error: "Stripe API error", valid: false },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to validate Stripe key",
            valid: false,
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // Validate OpenAI key
    if (credentialType === "OPENAI") {
      const apiKey = String(value).trim();
      if (!apiKey.startsWith("sk-proj-") && !apiKey.startsWith("sk-")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key format", valid: false },
          { status: 400 }
        );
      }

      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.ok) {
          return NextResponse.json({
            valid: true,
            message: "OpenAI key is valid",
            service: "OpenAI",
          });
        } else if (response.status === 401) {
          return NextResponse.json(
            { error: "OpenAI key is invalid or expired", valid: false },
            { status: 401 }
          );
        } else {
          return NextResponse.json(
            { error: "OpenAI API error", valid: false },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to validate OpenAI key",
            valid: false,
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // Validate GitHub token
    if (credentialType === "GITHUB") {
      const token = String(value).trim();
      if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
        return NextResponse.json(
          { error: "Invalid GitHub token format", valid: false },
          { status: 400 }
        );
      }

      try {
        const response = await fetch("https://api.github.com/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            valid: true,
            message: `GitHub token is valid (User: ${data.login})`,
            service: "GitHub",
            username: data.login,
          });
        } else if (response.status === 401) {
          return NextResponse.json(
            { error: "GitHub token is invalid or expired", valid: false },
            { status: 401 }
          );
        } else {
          return NextResponse.json(
            { error: "GitHub API error", valid: false },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to validate GitHub token",
            valid: false,
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Unsupported credential type", valid: false },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
