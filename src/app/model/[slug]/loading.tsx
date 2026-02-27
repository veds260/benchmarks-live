import { Navbar } from "@/components/navbar";

export default function ModelLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar maxWidth="max-w-5xl" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-36 bg-bg-card rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-bg-card rounded-lg" />
          ))}
        </div>
        <div className="h-72 bg-bg-card rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-bg-card rounded-lg" />
          <div className="h-64 bg-bg-card rounded-lg" />
        </div>
      </div>
    </div>
  );
}
