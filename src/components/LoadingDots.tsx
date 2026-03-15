export default function LoadingDots() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="flex gap-2">
        <span
          className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
