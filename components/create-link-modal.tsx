"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

const CreatedUrlSchema = z.object({
  shortCode: z.string(),
  originalUrl: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});

const ApiResponseSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), data: CreatedUrlSchema }),
  z.object({
    success: z.literal(false),
    error: z.object({ code: z.string(), message: z.string() }),
  }),
]);

export function CreateLinkModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setUrl("");
    setError(null);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: trimmed }),
      });

      const json = ApiResponseSchema.parse(await res.json());

      if (!json.success) {
        setError(json.error.message);
        return;
      }

      // Refresh server component data without full navigation
      router.refresh();
      setOpen(false);
      reset();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="default" />}>
        <PlusIcon className="size-4" />
        Create Link
      </DialogTrigger>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Create a short link</DialogTitle>
          <DialogDescription>
            Paste a long URL and we&apos;ll generate a short link for you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="original-url">Destination URL</Label>
            <Input
              id="original-url"
              type="url"
              placeholder="https://example.com/very/long/path"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" variant="default" disabled={loading}>
              {loading ? "Creating…" : "Create Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
