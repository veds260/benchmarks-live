import { Navbar } from "@/components/navbar";
import { SkeletonTable } from "@/components/skeleton-table";

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 bg-bg-card rounded-lg animate-pulse shrink-0"
            />
          ))}
        </div>
        <SkeletonTable rows={20} />
      </main>
    </div>
  );
}
