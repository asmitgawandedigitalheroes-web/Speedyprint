import type { CSSProperties } from 'react'

function SkeletonBox({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`bg-ed-surface/60 animate-pulse rounded ${className ?? ''}`} style={style} />
}

export default function DesignerLoading() {
  return (
    <div className="h-screen flex flex-col bg-ed-bg overflow-hidden">
      {/* Toolbar — breadcrumb left, title centre, icon buttons + Save/Export/AddToCart right */}
      <div className="h-11 border-b border-ed-border bg-ed-surface flex items-center gap-2 px-3 shrink-0">
        <SkeletonBox className="w-28 h-5 rounded" />
        <SkeletonBox className="w-px h-5 rounded-none" />
        <SkeletonBox className="w-36 h-5 rounded" />
        <div className="flex-1" />
        <SkeletonBox className="w-7 h-7 rounded" />
        <SkeletonBox className="w-7 h-7 rounded" />
        <SkeletonBox className="w-7 h-7 rounded" />
        <SkeletonBox className="w-7 h-7 rounded" />
        <SkeletonBox className="w-px h-5 rounded-none mx-1" />
        <SkeletonBox className="w-16 h-7 rounded-md" />
        <SkeletonBox className="w-20 h-7 rounded-md" />
        <SkeletonBox className="w-24 h-7 rounded-md" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left icon rail — narrow, icon + label stacked for each tool */}
        <div className="w-14 border-r border-ed-border bg-ed-surface flex flex-col items-center py-2 shrink-0">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-2 w-full px-1">
              <SkeletonBox className="w-5 h-5 rounded" />
              <SkeletonBox className="w-9 h-2 rounded" />
            </div>
          ))}
        </div>

        {/* Canvas — checkered background matching actual editor */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{
            backgroundImage: 'repeating-conic-gradient(#b0b0b0 0% 25%, #c8c8c8 0% 50%)',
            backgroundSize: '20px 20px',
          }}
        >
          <div className="bg-white shadow-2xl" style={{ width: '42%', aspectRatio: '1 / 1' }} />
        </div>

        {/* Right sidebar — PREVIEW / BACKGROUND / CMYK COLOURS sections */}
        <div className="w-64 border-l border-ed-border bg-ed-surface flex flex-col shrink-0 overflow-hidden">
          {/* PREVIEW section */}
          <div className="p-3 border-b border-ed-border">
            <SkeletonBox className="w-16 h-3 rounded mb-3" />
            <SkeletonBox className="w-full rounded" style={{ aspectRatio: '1 / 1' }} />
          </div>
          {/* BACKGROUND section */}
          <div className="p-3 border-b border-ed-border">
            <SkeletonBox className="w-24 h-3 rounded mb-3" />
            <div className="flex items-center gap-2">
              <SkeletonBox className="w-8 h-8 rounded" />
              <SkeletonBox className="flex-1 h-8 rounded" />
            </div>
          </div>
          {/* CMYK COLOURS section */}
          <div className="p-3">
            <SkeletonBox className="w-28 h-3 rounded mb-3" />
            <div className="grid grid-cols-6 gap-1">
              {[...Array(30)].map((_, i) => (
                <SkeletonBox key={i} className="w-full rounded" style={{ aspectRatio: '1 / 1' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar — object count + coords left, zoom right */}
      <div className="h-7 border-t border-ed-border bg-ed-surface flex items-center gap-3 px-3 shrink-0">
        <SkeletonBox className="w-16 h-3 rounded" />
        <SkeletonBox className="w-24 h-3 rounded" />
        <div className="flex-1" />
        <SkeletonBox className="w-10 h-3 rounded" />
        <SkeletonBox className="w-10 h-3 rounded" />
      </div>
    </div>
  )
}
