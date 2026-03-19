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

    const { friendshipId, action } = await req.json();

    if (!friendshipId || !action) {
      return NextResponse.json(
        { error: "friendshipId and action are required" },
        { status: 400 },
      );
    }
    if (!["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "action must be ACCEPT or REJECT" },
        { status: 400 },
      );
    }
    // Verify current user is the receiver
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friendship not found" },
        { status: 404 },
      );
    }
    if (friendship.receiverId !== userId) {
      return NextResponse.json(
        { error: "Only the receiver can respond" },
        { status: 403 },
      );
    }
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend respond error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
