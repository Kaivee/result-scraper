export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 pt-16 pb-12">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-blue-600/50 rounded animate-pulse" />
              <div className="h-10 w-64 sm:w-96 bg-blue-600/50 rounded animate-pulse" />
              <div className="h-4 w-48 bg-blue-600/50 rounded animate-pulse" />
            </div>
            <div className="flex flex-col gap-2 items-start sm:items-end">
              <div className="h-3 w-16 bg-blue-600/50 rounded animate-pulse" />
              <div className="h-5 w-48 sm:w-64 bg-blue-600/50 rounded animate-pulse" />
              <div className="h-3 w-24 bg-blue-600/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {/* Filter Bar Skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-24 animate-pulse" />

        {/* Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pulse">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 w-full">
                  <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="w-16 h-5 rounded-full bg-slate-200" />
                  <div className="h-6 w-16 bg-slate-200 rounded mt-1" />
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-5 w-12 bg-slate-200 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
