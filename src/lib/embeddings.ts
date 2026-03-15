import { google } from "@ai-sdk/google";
import { embed } from "ai";
import { prisma } from "@/lib/prisma";

export async function generateEmbeddings(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel("gemini-embedding-001"),
    value: text,
  });
  return embedding;
}

export async function storeEmbedding(
  messageId: string,
  embedding: number[],
): Promise<void> {
  await prisma.$executeRaw`
       UPDATE "Message"
    SET embedding = ${JSON.stringify(embedding)}::vector
    WHERE id = ${messageId}
    `;
}
