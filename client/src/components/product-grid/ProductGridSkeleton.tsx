export function ProductGridSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-12 space-y-6">
        <div className="h-12 w-64 bg-secondary rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-12 bg-secondary rounded-sm" />
          <div className="h-12 bg-secondary rounded-sm" />
          <div className="h-12 bg-secondary rounded-sm" />
          <div className="h-12 bg-secondary rounded-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-6">
            <div className="aspect-[3/4] bg-secondary rounded-sm" />
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1 space-y-3">
                <div className="h-6 w-3/4 bg-secondary rounded-sm" />
                <div className="h-4 w-1/2 bg-secondary rounded-sm" />
              </div>
              <div className="h-6 w-20 bg-secondary rounded-sm" />
            </div>
            <div className="h-10 w-full bg-secondary rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
