"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";


interface SignOutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignOutDialog({
  open,
  onClose,
  onConfirm,
}: SignOutDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center">
         <Image
              src="/sitelogo/jes-bg.png"
              alt="Jaipur Export Surplus"
              width={180}
              height={80}
              className="h-16 w-auto object-contain"
              priority
            />
        </div>

        {/* Title */}
        <h2 className="text-center text-1xl font-semibold text-foreground">
          Sign Out
        </h2>

        {/* Description */}
        <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">
          Are you sure you want to sign out of your account?
          <br />
          You will need to sign in again to continue.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer border-border hover:bg-muted"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer bg-gradient-to-r from-[#C9A227] via-[#D4AF37] to-[#E6C55A] text-black hover:brightness-95"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}