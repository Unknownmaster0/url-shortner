"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ApiResponse } from "@/lib/response"

interface LinkRowActionsProps {
  shortCode: string
}

export function LinkRowActions({ shortCode }: LinkRowActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleCopy() {
    const shortUrl = `${window.location.origin}/${shortCode}`
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    if (!window.confirm("Delete this short link? This cannot be undone.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/urls/${shortCode}`, { method: "DELETE" })
      const json = (await res.json()) as ApiResponse<{ deleted: boolean }>
      if (!json.success) {
        window.alert(json.error.message)
        return
      }
      router.refresh()
    } catch {
      window.alert("Something went wrong. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleCopy}
        title="Copy short link"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
      <Button
        variant="destructive"
        size="icon-sm"
        onClick={handleDelete}
        disabled={deleting}
        title="Delete short link"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}
