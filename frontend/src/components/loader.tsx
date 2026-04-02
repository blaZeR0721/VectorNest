export function Loader() {
  return (
    <div className="flex gap-3 max-w-[85%] mr-auto">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-secondary mt-1">
        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60"
            style={{
              animation: "dot-bounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
