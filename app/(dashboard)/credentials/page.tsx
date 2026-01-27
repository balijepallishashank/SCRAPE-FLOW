import React from "react";
import { ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CredentialsPage() {
  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credentials</h1>
          <p className="text-muted-foreground">
            Manage your API keys and credentials
          </p>
        </div>

        <Button>Add Credential</Button>
      </div>

      {/* Content */}
      <div className="flex-1 py-6">
        <div className="flex flex-col gap-4 h-full items-center justify-center text-center">
          <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
            <ShieldCheckIcon size={40} className="stroke-primary" />
          </div>

          <div className="space-y-1">
            <p className="font-bold">No credentials added yet</p>
            <p className="text-sm text-muted-foreground">
              Add credentials to connect external services
            </p>
          </div>

          <Button>Add Your First Credential</Button>
        </div>
      </div>
    </div>
  );
}
