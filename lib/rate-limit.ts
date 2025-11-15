import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/redis";

export async function rateLimit(
  identifier: string,
  options: {
    limit: number;
    windowSeconds: number;
  }
): Promise<NextResponse | null> {
  const { limit, windowSeconds } = options;
  
  const result = await checkRateLimit(
    `rate-limit:${identifier}`,
    limit,
    windowSeconds
  );

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        remaining: result.remaining,
        resetAt: result.resetAt,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.resetAt.toString(),
        },
      }
    );
  }

  return null;
}
