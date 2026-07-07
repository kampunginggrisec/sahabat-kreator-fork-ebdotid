import { cn } from "@/shared/lib/utils";

/**
 * A simple skeleton block with rounded corners and pulse animation.
 * Use for placeholder UI while data is loading in client components.
 */
export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted",
                className
            )}
        />
    );
}