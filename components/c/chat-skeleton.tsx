"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-in fade-in duration-500">
      <div className="text-center space-y-6 max-w-2xl mx-auto mb-12">
        <Skeleton className="w-16 h-16 rounded-2xl mx-auto" />
        <Skeleton className="h-10 w-96 mx-auto" />
        <Skeleton className="h-6 w-80 mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/50">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MessageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResponseLoadingSkeleton() {
  return (
    <div className="flex animate-in fade-in slide-in-from-bottom-2 duration-300 justify-start my-6">
      <div className="flex flex-col gap-3 max-w-[85%] w-full">
        <Skeleton className="h-5 w-[95%]" />
        <Skeleton className="h-5 w-[85%]" />
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-5 w-[75%]" />
        <Skeleton className="h-5 w-[82%]" />
      </div>
    </div>
  );
}
