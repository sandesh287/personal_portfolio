import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

interface ModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ title, description, isOpen, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <button
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />
      <section
        aria-modal="true"
        role="dialog"
        className={cn(
          "relative flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col rounded-md sm:max-h-[calc(100dvh-2rem)]",
          "border border-border bg-surface text-foreground shadow-xl",
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border p-3 sm:p-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
            onClick={onClose}
          >
            Close modal
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
