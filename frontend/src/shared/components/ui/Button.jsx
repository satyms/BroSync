/**
 * Button - Reusable button component with variants.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-mono font-semibold rounded-lg transition-all tracking-wider disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand-blue hover:bg-blue-500 text-white',
    secondary: 'bg-bg-hover hover:bg-bg-tertiary text-text-primary border border-border-primary',
    danger: 'bg-brand-red/20 hover:bg-brand-red/30 text-brand-red border border-brand-red/40',
    ghost: 'hover:bg-bg-hover text-text-secondary hover:text-text-primary',
    success: 'bg-brand-green/20 hover:bg-brand-green/30 text-brand-green border border-brand-green/40',
    outline: 'border border-brand-blue text-brand-blue hover:bg-brand-blue/10',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 gap-1',
    sm: 'text-sm px-3 py-2 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          {children}
        </>
      ) : children}
    </button>
  );
}
