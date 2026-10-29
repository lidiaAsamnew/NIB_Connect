import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-slate-700">The page you are looking for does not exist.</p>
      <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-brand underline">
        Go to the home page
      </Link>
    </section>
  );
}
