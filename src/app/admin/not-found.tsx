import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div>
      <h1 className="font-serif text-4xl">Not found</h1>
      <p className="mt-3 text-muted">That admin record does not exist.</p>
      <Link href="/admin" className="mt-6 inline-block text-sm hover:text-gold-dark">
        Back to admin
      </Link>
    </div>
  );
}
