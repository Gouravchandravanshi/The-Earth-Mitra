export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`skeleton rounded-md ${className}`} />;
}

export function LoadingRegion({ label = 'Loading content…', className = '', children }) {
  return <div role="status" aria-live="polite" className={className}>
    <span className="sr-only">{label}</span>
    <div aria-hidden="true">{children}</div>
  </div>;
}

export function ProductCardSkeleton() {
  return <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
    <Skeleton className="aspect-square shrink-0 rounded-none" />
    <div className="flex flex-1 flex-col gap-3 p-3 pt-6">
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-5 w-2/5" />
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-24" /><Skeleton className="h-[35px] w-[100px]" />
      </div>
    </div>
  </div>;
}

export function ProductGridSkeleton({ count = 4, home = false, label = 'Loading products…', className = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4' }) {
  return <LoadingRegion label={label}>
    <div className={home ? 'grid justify-center gap-6' : className} style={home ? { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 330px))' } : undefined}>
      {Array.from({ length: count }, (_, index) => <ProductCardSkeleton key={index} />)}
    </div>
  </LoadingRegion>;
}

export function ContentGridSkeleton({ count = 3, featured = false, label = 'Loading stories…', className = '', gridClassName = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' }) {
  return <LoadingRegion label={label} className={className}>
    {featured && <div className="mb-10 grid overflow-hidden rounded-2xl border border-gray-100 lg:grid-cols-2">
      <Skeleton className="h-64 rounded-none lg:h-80" />
      <div className="space-y-5 p-7 lg:p-10"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-4/5" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
    </div>}
    <div className={gridClassName}>
      {Array.from({ length: count }, (_, index) => <div key={index} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
        <Skeleton className="h-56 rounded-none" />
        <div className="space-y-3 p-5"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-6 w-4/5" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
      </div>)}
    </div>
  </LoadingRegion>;
}

export function ProductDetailSkeleton() {
  return <LoadingRegion label="Loading product…" className="mx-auto max-w-[1680px] px-5 py-5 lg:px-10">
    <Skeleton className="mb-8 h-4 w-56" />
    <div className="grid gap-10 lg:grid-cols-2">
      <div><Skeleton className="aspect-square w-full rounded-2xl" /><div className="mt-4 flex gap-3">{[0, 1, 2, 3].map(index => <Skeleton key={index} className="h-16 w-16 sm:h-20 sm:w-20" />)}</div></div>
      <div className="space-y-6 py-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-4/5" /><Skeleton className="h-5 w-40" /><Skeleton className="h-8 w-32" /><div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div><Skeleton className="h-12 w-40" /><Skeleton className="h-12 w-full" /><Skeleton className="h-28 w-full" /></div>
    </div>
  </LoadingRegion>;
}

export function ArticleSkeleton() {
  return <LoadingRegion label="Loading article…" className="mx-auto max-w-4xl px-5 py-10">
    <Skeleton className="mb-8 h-4 w-40" /><Skeleton className="mb-4 h-10 w-5/6" /><Skeleton className="mb-8 h-4 w-48" /><Skeleton className="mb-8 aspect-video w-full rounded-2xl" />
    <div className="space-y-4">{[0, 1, 2, 3, 4].map(index => <Skeleton key={index} className={`h-4 ${index === 4 ? 'w-2/3' : 'w-full'}`} />)}</div>
  </LoadingRegion>;
}

export function CollectionDetailSkeleton() {
  return <div>
    <LoadingRegion label="Loading collection…" className="bg-[#FAFAF7] px-4 py-14">
      <div className="mx-auto max-w-7xl space-y-4 lg:px-4"><Skeleton className="h-10 w-2/3 sm:w-80" /><Skeleton className="h-4 w-3/4 sm:w-96" /><Skeleton className="h-4 w-24" /></div>
    </LoadingRegion>
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8"><ProductGridSkeleton /></div>
  </div>;
}

export function RowsSkeleton({ count = 3, label = 'Loading orders…', className = 'space-y-4' }) {
  return <LoadingRegion label={label}>
    <div className={className}>{Array.from({ length: count }, (_, index) => <div key={index} className="flex gap-4 rounded-xl border border-gray-100 p-5">
      <Skeleton className="h-16 w-16 shrink-0" /><div className="flex-1 space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/3" /></div>
    </div>)}</div>
  </LoadingRegion>;
}
