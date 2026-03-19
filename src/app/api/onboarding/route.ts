export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, bio } = await req.json();

    if (!username?.trim()) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Check username is not taken
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 },
      );
    }

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username,
        bio: bio ?? null,
        onboarded: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
