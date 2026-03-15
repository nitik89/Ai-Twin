type AssistantMessageBubbleProps = {
  text: string;
};

export default function AssistantMessageBubble({ text }: AssistantMessageBubbleProps) {
  return (
    <div className="flex items-start gap-3 ml-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20 text-[10px] font-semibold text-purple-200">
        AT
      </div>
      <div className="flex max-w-[75%] flex-col">
        <div className="rounded-2xl rounded-bl-sm bg-gray-800 px-4 py-3 text-sm leading-relaxed text-gray-50 shadow-lg shadow-black/40">
          {text}
        </div>
        <span className="mt-1 text-xs text-gray-500">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
