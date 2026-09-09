"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * DevFlow ships a single dark theme, so the toaster is pinned to `dark`
 * rather than following the OS preference — a system-light machine would
 * otherwise render white toasts on top of the dark application surface.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="text-status-success size-4" />,
        info: <InfoIcon className="text-status-info size-4" />,
        warning: <TriangleAlertIcon className="text-status-warning size-4" />,
        error: <OctagonXIcon className="text-status-danger size-4" />,
        loading: <Loader2Icon className="text-text-secondary size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface-2)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--line-strong)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
