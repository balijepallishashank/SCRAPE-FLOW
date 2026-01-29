"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CoinsIcon,
  HomeIcon,
  Layers2Icon,
  ShieldCheckIcon,
  ScrollTextIcon,
  Menu,
  ClockIcon,
  LayoutTemplateIcon,
} from "lucide-react";

import Logo from "./Logo";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getUserBalance } from "@/actions/user/getUserBalance";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const routes = [
  {
    href: "/",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/workflows",
    label: "Workflows",
    icon: Layers2Icon,
  },
  {
    href: "/templates",
    label: "Templates",
    icon: LayoutTemplateIcon,
  },
  {
    href: "/runs",
    label: "Runs",
    icon: ClockIcon,
  },
  {
    href: "/audit",
    label: "Audit Logs",
    icon: ScrollTextIcon,
  },
  {
    href: "/credentials",
    label: "Credentials",
    icon: ShieldCheckIcon,
  },
  {
    href: "/billing",
    label: "Billing",
    icon: CoinsIcon,
  },
];

function DesktopSidebar() {
  const pathname = usePathname();

  const { data: credits } = useQuery({
    queryKey: ["user-balance"],
    queryFn: () => getUserBalance(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const activeRoute =
    routes.find(
      (route) =>
        route.href !== "/" && pathname.startsWith(route.href)
    ) || routes[0];

  return (
    <div className="hidden relative md:block min-w-[280px] max-w-[280px] h-screen overflow-hidden w-full bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r border-separate">
      <div className="flex items-center justify-center gap-2 border-b border-separate p-4">
        <Logo />
      </div>

      <div className="p-4">
        <Link
          href="/billing"
          className="block group"
        >
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 hover:border-primary/50 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available Credits</span>
              <CoinsIcon size={16} className="text-yellow-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">{credits ?? "..."}</span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Click to manage →
            </div>
          </div>
        </Link>
      </div>

      <div className="flex flex-col p-2 gap-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            aria-current={
              activeRoute.href === route.href ? "page" : undefined
            }
            className={cn(
              buttonVariants({
                variant:
                  activeRoute.href === route.href
                    ? "sidebarItemActive"
                    : "sidebarItem",
              }),
              "justify-start gap-3"
            )}
          >
            <route.icon size={18} />
            <span>{route.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const activeRoute =
    routes.find(
      (route) =>
        route.href !== "/" && pathname.startsWith(route.href)
    ) || routes[0];

  return (
    <div className="block border-separate bg-background md:hidden">
      <nav className="container flex items-center justify-between px-4 h-[56px]">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[280px] space-y-4">
            <Logo />

            <div className="flex flex-col gap-1">
              {routes.map((route) => (
<Link
  key={route.href}
  href={route.href}
  onClick={() => setIsOpen(false)}
  aria-current={
    activeRoute.href === route.href ? "page" : undefined
  }
  className={cn(
    buttonVariants({
      variant:
        activeRoute.href === route.href
          ? "sidebarItemActive"
          : "sidebarItem",
    }),
    "justify-start gap-3"
  )}
>
  <route.icon size={20} />
  <span>{route.label}</span>
</Link>

              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

export { MobileSidebar };
export default DesktopSidebar;
