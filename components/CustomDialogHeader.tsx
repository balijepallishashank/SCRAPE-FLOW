"use client";

import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  subTitle?: string;
  icon?: LucideIcon;
  titleClassName?: string;
  subTitleClassName?: string;
  iconClassName?: string;
}

function CustomDialogHeader(props: Props) {
  return (
    <DialogHeader className="py-6">
      <DialogTitle asChild>
        <div className="flex flex-col items-center gap-2 mb-2">
          {props.icon && (
            <props.icon size={30} className={cn("stroke-primary", props.iconClassName)} />
          )}
          {props.title && (
            <p className={cn("text-xl text-primary", props.titleClassName)}>
              {props.title}
            </p>
          )}
        </div>
      </DialogTitle>
      {props.subTitle && (
        <DialogDescription className="text-center">
          {props.subTitle}
        </DialogDescription>
      )}
      <Separator />
    </DialogHeader>
  );
}

export default CustomDialogHeader;
