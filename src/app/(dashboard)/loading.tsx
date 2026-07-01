export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-4 animate-pulse">
      <div className="h-7 w-48 rounded bg-gray-200" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white border border-gray-100" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-white border border-gray-100" />
        ))}
      </div>
    </div>
  )
}
