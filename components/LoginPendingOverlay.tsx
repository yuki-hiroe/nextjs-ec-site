type LoginPendingOverlayProps = {
  show: boolean;
  title?: string;
  description?: string;
};

export default function LoginPendingOverlay({
  show,
  title = "ログインしています",
  description = "認証が完了すると、自動で移動します",
}: LoginPendingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/85 px-6 text-center backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"
        aria-hidden="true"
      />
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
