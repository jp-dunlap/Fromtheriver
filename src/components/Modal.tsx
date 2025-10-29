import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const headingId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousActiveElementRef.current = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ];

    const getFocusableElements = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelectors.join(",")),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      );

    const focusWithinDialog = () => {
      const focusable = getFocusableElements();
      const firstFocusable = focusable[0];
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        dialog.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (
          !activeElement ||
          !dialog.contains(activeElement) ||
          activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        }
      } else if (
        !activeElement ||
        !dialog.contains(activeElement) ||
        activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (dialog.contains(event.target as Node)) {
        return;
      }
      focusWithinDialog();
    };

    focusWithinDialog();

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    if (typeof document === "undefined") {
      return undefined;
    }

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      const previous = previousActiveElementRef.current as HTMLElement | null;
      if (previous) {
        previous.focus();
      }
      return;
    }

    return () => {
      const previous = previousActiveElementRef.current as HTMLElement | null;
      if (previous) {
        previous.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="relative node-card w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 m-4 focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h3 id={headingId} className="font-serif text-3xl text-white mb-4">
          {title}
        </h3>
        <div id={descriptionId}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
