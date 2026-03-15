export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 ml-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20 text-[10px] font-semibold text-purple-200">
        AT
      </div>
      <div className="flex max-w-[60%] flex-col">
        <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-800 px-4 py-3 shadow-lg shadow-black/40">
          <span
            className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="mt-1 text-xs text-gray-500">typing…</span>
      </div>
    </div>
  );
}
