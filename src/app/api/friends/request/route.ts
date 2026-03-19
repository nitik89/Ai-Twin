export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json(
        { error: "receiverId is required" },
        { status: 400 },
      );
    }

    if (receiverId === userId) {
      return NextResponse.json(
        { error: "Cannot send request to yourself" },
        { status: 400 },
      );
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId },
          { requesterId: receiverId, receiverId: userId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Friend request already exists" },
        { status: 400 },
      );
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        receiverId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, friendship });
  } catch (error) {
    console.error("Friend request error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
