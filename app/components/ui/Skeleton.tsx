export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[12px] bg-surface-2 motion-reduce:animate-none ${className}`} aria-hidden="true" />;
}
