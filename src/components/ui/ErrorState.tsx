interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div role="alert" className={`text-center py-16 px-6 ef-fade-in ${className}`}>
      <div className="text-5xl mb-4" aria-hidden="true">
        ⚠️
      </div>
      <h3 className="text-lg font-semibold text-[#0F172A] mb-1.5">{title}</h3>
      <p className="text-[#64748B] text-sm max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 px-4 py-2 rounded-[10px] bg-[#4F46E5] text-white text-sm font-medium hover:bg-[#4338CA] transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
