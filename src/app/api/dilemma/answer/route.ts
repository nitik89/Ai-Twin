import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { answer, dilemmaId } = await req.json();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!answer || !dilemmaId) {
      return Response.json(
        { error: "answer and dilemmaId are required" },
        { status: 400 },
      );
    }
    await prisma.dailyDilemma.update({
      where: { id: dilemmaId },
      data: { answer, answeredAt: new Date() },
    });

    const dilemma = await prisma.dailyDilemma.findUnique({
      where: { id: dilemmaId },
    });

    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/behaviour`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Dilemma: ${dilemma?.question} — User chose: ${answer}`,
        userId,
      }),
    }).catch((err) => console.error("Behaviour extraction failed:", err));
    return Response.json({ success: true });
  } catch (err) {
    console.error("Dilemma answer error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
