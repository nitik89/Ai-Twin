type UserMessageBubbleProps = {
  text: string;
};

export default function UserMessageBubble({ text }: UserMessageBubbleProps) {
  return (
    <div className="flex justify-end gap-3">
      <div className="flex max-w-[75%] flex-col items-end">
        <div className="rounded-2xl rounded-br-sm bg-purple-600 px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-purple-900/30">
          {text}
        </div>
        <span className="mt-1 text-xs text-gray-500">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20 text-[10px] font-semibold text-purple-200">
        You
      </div>
    </div>
  );
}
