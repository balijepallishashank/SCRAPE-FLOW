"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { paramProps } from "@/types/appNode";
import { useId, useState, useEffect } from "react";

function StringParam({ param, value, updateNodeParamValue }: paramProps) {
  const [internalValue, setInternalValue] = useState<string>(value ?? "");
  const id = useId();

  // Sync internal value when external value changes
  useEffect(() => {
    setInternalValue(value ?? "");
  }, [value]);

  const isTextarea = param.variant === "textarea";

  return (
    <div className="space-y-1 p-1 w-full">
      <Label htmlFor={id} className="text-xs flex">
        {param.name}
        {param.required && <p className="text-red-400 px-2">*</p>}
      </Label>

      {isTextarea ? (
        <Textarea
          id={id}
          className="text-xs resize-none"
          rows={5}
          value={internalValue}
          placeholder="Enter value here"
          onChange={(e) => setInternalValue(e.target.value)}
          onBlur={(e) => updateNodeParamValue(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          className="text-xs"
          value={internalValue}
          placeholder="Enter value here"
          onChange={(e) => setInternalValue(e.target.value)}
          onBlur={(e) => updateNodeParamValue(e.target.value)}
        />
      )}

      {param.helperText && (
        <p className="text-xs text-muted-foreground px-2">{param.helperText}</p>
      )}
    </div>
  );
}

export default StringParam;