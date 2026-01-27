"use client";

import { paramProps } from "@/types/appNode";
import { GlobeIcon } from "lucide-react";

function BrowserInstanceParam({ param }: paramProps) {
  return (
    <div className="flex items-center gap-2 p-2 w-full">
      <GlobeIcon size={16} className="text-muted-foreground" />
      <div className="flex-1">
        <p className="text-xs font-medium">{param.name}</p>
        {param.helperText && (
          <p className="text-xs text-muted-foreground">{param.helperText}</p>
        )}
      </div>
      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
        Auto-connected
      </div>
    </div>
  );
}

export default BrowserInstanceParam;
