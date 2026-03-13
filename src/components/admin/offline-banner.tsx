interface OfflineBannerProps {
  message?: string;
}

export default function OfflineBanner({
  message = "Database is currently unreachable. Showing placeholder data.",
}: OfflineBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 9v4" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 17h.01" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M10.3 4.3l-7.4 12.8a1.5 1.5 0 0 0 1.3 2.2h15.6a1.5 1.5 0 0 0 1.3-2.2L13.7 4.3a1.5 1.5 0 0 0-3.4 0z"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{message}</span>
    </div>
  );
}
