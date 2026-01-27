import React from "react";
import { CoinsIcon } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreditUsageCharts from "@/components/CreditUsageCharts";

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

        <Button>Purchase Credits</Button>
      </div>

      {/* Content */}
      <div className="flex-1 py-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
            <CardDescription>Your available credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-50 p-4">
                <CoinsIcon size={32} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-4xl font-bold">{userBalance.credits}</p>
                <p className="text-muted-foreground">Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit Packages</CardTitle>
            <CardDescription>Purchase more credits</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-2xl font-bold">100 Credits</p>
              <p className="text-3xl font-bold">$10</p>
              <Button className="w-full">Buy Now</Button>
            </div>
            <div className="border rounded-lg p-4 space-y-2 bg-accent">
              <p className="text-2xl font-bold">500 Credits</p>
              <p className="text-3xl font-bold">$40</p>
              <p className="text-sm text-green-600">Save 20%</p>
              <Button className="w-full">Buy Now</Button>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-2xl font-bold">1000 Credits</p>
              <p className="text-3xl font-bold">$70</p>
              <p className="text-sm text-green-600">Save 30%</p>
              <Button className="w-full">Buy Now</Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Usage Charts */}
        <CreditUsageCharts />
      </div>
    </div>
  );
}
