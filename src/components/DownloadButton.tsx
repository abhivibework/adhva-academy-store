export function DownloadButton({
  orderItemId,
  label = "Download",
}: {
  orderItemId: string;
  label?: string;
}) {
  return (
    <a
      href={`/api/download/issue/${orderItemId}`}
      className="inline-flex items-center border border-foreground px-4 py-2 text-sm tracking-wide text-foreground hover:border-gold hover:text-gold-dark"
    >
      {label}
    </a>
  );
}
