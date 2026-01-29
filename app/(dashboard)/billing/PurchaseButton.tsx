"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  discount?: number;
  features: string[];
}

const packages: Record<string, CreditPackage> = {
  standard: {
    id: "standard",
    credits: 100,
    price: 10,
    features: [
      "100 API calls",
      "1 month validity",
      "Email support"
    ]
  },
  popular: {
    id: "popular",
    credits: 500,
    price: 40,
    discount: 20,
    features: [
      "500 API calls",
      "3 months validity",
      "Priority support"
    ]
  },
  premium: {
    id: "premium",
    credits: 1000,
    price: 70,
    discount: 30,
    features: [
      "1000 API calls",
      "6 months validity",
      "24/7 support"
    ]
  }
};

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageKey: string;
}

function PurchaseDialog({ open, onOpenChange, packageKey }: PurchaseDialogProps) {
  const pkg = packages[packageKey];
  const [isLoading, setIsLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  if (!pkg) return null;

  const handlePurchase = async () => {
    try {
      // Validation
      if (!cardNumber || !expiryDate || !cvv) {
        toast.error("Please fill in all payment details");
        return;
      }

      if (cardNumber.length < 13) {
        toast.error("Invalid card number");
        return;
      }

      setIsLoading(true);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("/api/billing/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          credits: pkg.credits,
          amount: pkg.price,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error("Purchase failed");
      }

      const data = await response.json();

      toast.success("Purchase successful!", {
        description: `${pkg.credits} credits added to your account`,
      });

      onOpenChange(false);
      // Reset form
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out. Please try again."
          : error instanceof Error
          ? error.message
          : "Unknown error";
      toast.error("Purchase failed", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const discountAmount = pkg.price * (pkg.discount || 0) / 100;
  const finalPrice = pkg.price - discountAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Purchase {pkg.credits} Credits</DialogTitle>
          <DialogDescription>
            Complete your purchase to add credits to your account
          </DialogDescription>
        </DialogHeader>

        {/* Order Summary */}
        <Card className="bg-muted/50 border-0">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Package:</span>
                <span className="font-medium">{pkg.credits} Credits</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">${pkg.price}</span>
              </div>
              {pkg.discount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({pkg.discount}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-lg">${finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-number">Card Number</Label>
            <Input
              id="card-number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
              maxLength={16}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.length >= 2) {
                    val = val.slice(0, 2) + "/" + val.slice(2, 4);
                  }
                  setExpiryDate(val);
                }}
                maxLength={5}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                maxLength={4}
                type="password"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
            <ShieldCheckIcon size={16} className="flex-shrink-0" />
            <span>This is a demo. Use test card: 4532 1234 5678 9010</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2Icon size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${finalPrice.toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PurchaseButtonProps {
  packageKey: string;
  children: React.ReactNode;
}

export function PurchaseButton({ packageKey, children }: PurchaseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        {children}
      </Button>
      <PurchaseDialog open={open} onOpenChange={setOpen} packageKey={packageKey} />
    </>
  );
}
