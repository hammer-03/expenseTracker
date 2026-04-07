"use client"

import { useState } from "react"
import { Users, Mail, Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createGroup } from "@/lib/api/groups"

interface CreateGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateGroupModal({ open, onOpenChange, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const addEmail = () => {
    if (!email || !email.includes("@")) return
    if (emails.includes(email)) return
    setEmails([...emails, email])
    setEmail("")
  }

  const removeEmail = (e: string) => {
    setEmails(emails.filter((item) => item !== e))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || submitting) return

    setSubmitting(true)
    try {
      await createGroup({ name, memberEmails: emails })
      toast.success("Group created!")
      setName("")
      setEmails([])
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create group")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <Users className="size-5 text-accent" />
            </div>
            <div>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Share expenses with roommates or friends
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Roommates 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Invite Members (by email)</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                className="bg-input border-border"
              />
              <Button type="button" variant="outline" onClick={addEmail}>
                <Plus className="size-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {emails.map((e) => (
                <div key={e} className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2 py-1 rounded-md text-xs text-accent">
                  {e}
                  <button type="button" onClick={() => removeEmail(e)}>
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {emails.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">No members added yet</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={!name || submitting}>
              {submitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
