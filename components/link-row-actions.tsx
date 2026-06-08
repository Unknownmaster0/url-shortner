"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ApiResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    data: z.object({ deleted: z.boolean() }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({ code: z.string(), message: z.string() }),
  }),
]);

interface LinkRowActionsProps {
  shortCode: string;
}

export function LinkRowActions({ shortCode }: LinkRowActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleCopy() {
    const shortUrl = `${window.location.origin}/${shortCode}`;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/urls/${shortCode}`, { method: "DELETE" });
      const json = ApiResponseSchema.parse(await res.json());
      if (!json.success) {
        window.alert(json.error.message);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } catch {
      window.alert("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleCopy}
          title="Copy short link"
          aria-label="Copy short link"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          title="Delete short link"
          aria-label="Delete short link"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete short link</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-mono font-medium text-foreground">
              /{shortCode}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
