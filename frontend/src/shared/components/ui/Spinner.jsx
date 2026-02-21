/**
 * Spinner - Loading spinner component.
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-4' };
  return (
    <div
      className={`${sizes[size]} rounded-full border-text-muted border-t-brand-blue animate-spin ${className}`}
    />
  );
}

/**
 * PageLoader - Full-page loading state.
 */
export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-text-secondary font-mono text-sm tracking-widest animate-pulse">{text}</p>
    </div>
  );
}

/**
 * InlineLoader - inline loading dots.
 */
export function InlineLoader() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
