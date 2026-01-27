"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Editor Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 gap-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={32} />
            <h2 className="text-2xl font-bold">Something went wrong</h2>
          </div>
          <p className="text-muted-foreground text-center max-w-md">
            The workflow editor encountered an unexpected error. Please try refreshing the page.
          </p>
          {this.state.error && (
            <pre className="text-xs bg-muted p-4 rounded-md max-w-2xl overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant="default"
          >
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EditorErrorBoundary;
