import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkflowCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Play button skeleton */}
          <Skeleton className="h-10 w-10 rounded-lg" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Action button */}
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkflowCardListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <WorkflowCardSkeleton key={i} />
      ))}
    </div>
  );
}
