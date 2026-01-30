"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

const packages: Record<string, { id: string }> = {
  standard: { id: "standard" },
  popular: { id: "popular" },
  premium: { id: "premium" },
};

export function PurchaseButton({
  packageKey,
  children,
}: {
  packageKey: string;
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const pkg = packages[packageKey];

  const handleCheckout = async () => {
    if (!pkg) {
      toast.error("Invalid package");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/billing/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create checkout session");
      }

      const data = await response.json();

      if (!data?.url) {
        throw new Error("Stripe session URL missing");
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button className="w-full gap-2" onClick={handleCheckout} disabled={isLoading}>
      {isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
