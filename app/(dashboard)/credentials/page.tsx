import React from "react";
import { CredentialsClient } from "./CredentialsClient";

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
      </div>

      {/* Content */}
      <div className="flex-1 py-6">
        <CredentialsClient />
      </div>
    </div>
  );
}
