import { generateEmbeddings } from "./embeddings";
import { prisma } from "@/lib/prisma";

type SimilarMessage = {
  id: string;
  content: string;
  role: string;
  createdAt: Date;
};

export async function searchSimilarMessages(
  query: string,
  userId: string,
  limit: number = 5,
): Promise<SimilarMessage[]> {
  const queryEmbedding = await generateEmbeddings(query);
  const queryVector = JSON.stringify(queryEmbedding);
  const results = await prisma.$queryRaw<SimilarMessage[]>`
    SELECT 
      m.id,
      m.content,
      m.role,
      m."createdAt"
    FROM "Message" m
    JOIN "Conversation" c ON m."conversationId" = c.id
    WHERE c."userId" = ${userId}
    AND m.embedding IS NOT NULL
    ORDER BY m.embedding <=> ${queryVector}::vector
    LIMIT ${limit}
  `;
  return results;
}
