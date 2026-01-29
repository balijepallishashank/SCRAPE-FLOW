import React from "react";
import { CoinsIcon, TrendingUpIcon, ShieldCheckIcon } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreditUsageCharts from "@/components/CreditUsageCharts";
import { PurchaseButton } from "./PurchaseButton";

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  // Get or create user balance
  let userBalance = await prisma.userBalance.findUnique({
    where: { userId },
  });

  if (!userBalance) {
    userBalance = await prisma.userBalance.create({
      data: {
        userId,
        credits: 1000,
      },
    });
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your credits and billing
          </p>
        </div>

        <Button className="gap-2">
          <TrendingUpIcon size={16} />
          Purchase Credits
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 py-6 space-y-6">
        {/* Current Balance Card */}
        <Card className="border-2 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
            <CardDescription>Your available credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/40 p-4">
                <CoinsIcon size={32} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400">
                  {userBalance.credits}
                </p>
                <p className="text-muted-foreground">Credits available</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold">${(userBalance.credits * 0.10).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Packages */}
        <div>
          <h2 className="text-xl font-bold mb-4">Purchase Credit Packages</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Standard Package */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl">100 Credits</CardTitle>
                <CardDescription>Perfect for testing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">$10</p>
                  <p className="text-sm text-muted-foreground">$0.10 per credit</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>100 API calls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>1 month validity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>Email support</span>
                  </li>
                </ul>
                <PurchaseButton packageKey="standard">Buy Now</PurchaseButton>
              </CardContent>
            </Card>

            {/* Popular Package */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-green-500/50 border-2 bg-green-50/30 dark:bg-green-950/20">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                SAVE 20%
              </div>
              <CardHeader>
                <CardTitle className="text-xl">500 Credits</CardTitle>
                <CardDescription>Most popular choice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">$40</p>
                  <p className="text-sm text-muted-foreground">$0.08 per credit</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>500 API calls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>3 months validity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <PurchaseButton packageKey="popular">Buy Now</PurchaseButton>
              </CardContent>
            </Card>

            {/* Premium Package */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl">1000 Credits</CardTitle>
                <CardDescription>Best value</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">$70</p>
                  <p className="text-sm text-muted-foreground">$0.07 per credit</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>1000 API calls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>6 months validity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={16} className="text-green-600" />
                    <span>24/7 support</span>
                  </li>
                </ul>
                <PurchaseButton packageKey="premium">Buy Now</PurchaseButton>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Credit Usage Charts */}
        <CreditUsageCharts />
      </div>
    </div>
  );
}

