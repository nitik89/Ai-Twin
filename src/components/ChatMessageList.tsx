import { RefObject } from "react";
import UserMessageBubble from "./UserMessageBubble";
import AssistantMessageBubble from "./AssistantMessageBubble";
import TypingIndicator from "./TypingIndicator";

export type ChatMessage = {
  id: string;
  role: string;
  parts: Array<{ type: string; text?: string }>;
};

type ChatMessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

function getMessageText(parts: ChatMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && "text" in p)
    .map((p) => p.text)
    .join("");
}

export default function ChatMessageList({
  messages,
  isLoading,
  messagesEndRef,
}: ChatMessageListProps) {
  return (
    <div className="space-y-6">
      {messages.length === 0 && !isLoading && (
        <div className="flex h-full items-center justify-center py-20">
          <p className="text-center text-gray-500 text-sm">
            Hi, I am your AI Twin. Start talking to me.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? (
            <UserMessageBubble text={getMessageText(message.parts)} />
          ) : (
            <AssistantMessageBubble text={getMessageText(message.parts)} />
          )}
        </div>
      ))}

      {isLoading && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
