export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="space-y-4 w-64">
        <div className="animate-pulse bg-gray-200 rounded-lg h-8 w-full" />
        <div className="animate-pulse bg-gray-200 rounded-lg h-4 w-3/4" />
        <div className="animate-pulse bg-gray-200 rounded-lg h-4 w-1/2" />
      </div>
    </div>
  );
}
