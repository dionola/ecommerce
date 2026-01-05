"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { X } from "lucide-react"

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border-none rounded-none overflow-hidden">
        <DialogHeader className="p-8 border-b border-border bg-secondary">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold uppercase tracking-tighter">
              {mode === "login" ? "Sign In" : "Create Account"}
            </DialogTitle>
            <button onClick={onClose} className="p-2 hover:bg-background transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="EMAIL@DOMAIN.COM"
                className="rounded-none border-border h-12 text-xs font-bold tracking-widest uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
              <Input
                type="password"
                placeholder="********"
                className="rounded-none border-border h-12 text-xs font-bold tracking-widest uppercase"
              />
            </div>
            {mode === "register" && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  placeholder="********"
                  className="rounded-none border-border h-12 text-xs font-bold tracking-widest uppercase"
                />
              </div>
            )}
          </div>

          <Button className="w-full h-14 rounded-none bg-black text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-zinc-800 transition-all">
            {mode === "login" ? "Secure Login" : "Initialize Account"}
          </Button>

          <div className="pt-4 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black underline underline-offset-4 transition-colors"
            >
              {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
