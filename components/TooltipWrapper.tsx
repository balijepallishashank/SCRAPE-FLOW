"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from 'react';
interface Props{
  content:React.ReactNode;
  children:React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

function TooltipWrapper(props:Props) {
  return<TooltipProvider delayDuration={0}>
    <Tooltip>
        <TooltipTrigger asChild>
            {props.children}
        </TooltipTrigger>
        <TooltipContent side={props.side}>
            {props.content}
        </TooltipContent>
    </Tooltip>
  </TooltipProvider>
}

export default TooltipWrapper
