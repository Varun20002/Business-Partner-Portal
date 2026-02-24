import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-7xl font-heading font-bold text-gray-200">404</div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Page Not Found
        </h1>
        <p className="text-gray-500 font-body">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-brand-alert text-white font-heading font-semibold rounded-xl hover:bg-orange-600 transition-colors text-sm"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
