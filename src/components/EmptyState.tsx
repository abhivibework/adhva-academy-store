export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="border border-dashed border-line px-8 py-16 text-center">
      <h2 className="font-serif text-2xl text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-muted">{body}</p>
    </div>
  );
}
