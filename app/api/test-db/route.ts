import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Mencoba melakukan query paling ringan ke database
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const latency = Date.now() - start;

    return NextResponse.json({
      success: true,
      message: "Database connected successfully!",
      latencyMs: latency,
      databaseUrl: process.env.DATABASE_URL 
        ? "SET (Hidden for security)" 
        : "NOT SET",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to database.",
        error_name: error?.name || "Unknown Error",
        error_message: error?.message || String(error),
        error_code: error?.code || "No code",
      },
      { status: 500 }
    );
  }
}
