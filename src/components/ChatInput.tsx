type ChatInputProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
};
//Hello
export default function ChatInput({
  inputValue,
  onInputChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 px-3 py-3 sm:px-6 sm:py-4">
      <form onSubmit={onSubmit}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            aria-label="Attach a file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15V8a5 5 0 0 0-10 0v9a3 3 0 0 1-6 0V9" />
            </svg>
          </button>

          <div className="flex flex-1 items-center gap-3 rounded-full bg-gray-800 px-4 py-2 shadow-inner shadow-black/40">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-900/50 transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
          </button>
        </div>
      </form>
    </footer>
  );
}
