import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useState } from "react"
import { X } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "confirm">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmationCode, setConfirmationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { signIn, signUp, confirmSignUp, resendConfirmationCode } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await signIn(email, password)
      setSuccess("Successfully signed in!")
      setTimeout(() => {
        onClose()
        resetForm()
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      let errorMessage = 'Authentication failed'
      
      if (err.code === 'NotAuthorizedException') {
        errorMessage = 'Incorrect email or password'
      } else if (err.code === 'UserNotConfirmedException') {
        errorMessage = 'Please confirm your email address. Check your inbox for a confirmation code.'
        setMode('confirm')
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await signUp(email, password, name || undefined)
      setSuccess("Account created! Please check your email for a confirmation code.")
      setMode('confirm')
    } catch (err: any) {
      let errorMessage = 'Registration failed'
      
      if (err.code === 'UsernameExistsException') {
        errorMessage = 'An account with this email already exists'
      } else if (err.code === 'InvalidPasswordException') {
        errorMessage = 'Password does not meet requirements'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await confirmSignUp(email, confirmationCode)
      setSuccess("Email confirmed! You can now sign in.")
      setTimeout(() => {
        setMode('login')
        setConfirmationCode("")
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      let errorMessage = 'Confirmation failed'
      
      if (err.code === 'CodeMismatchException') {
        errorMessage = 'Invalid confirmation code'
      } else if (err.code === 'ExpiredCodeException') {
        errorMessage = 'Confirmation code has expired. Please request a new one.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await resendConfirmationCode(email)
      setSuccess("Confirmation code resent! Check your email.")
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation code')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setName("")
    setConfirmationCode("")
    setError(null)
    setSuccess(null)
    setMode("login")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 border-none rounded-none overflow-hidden">
        <DialogHeader className="p-8 border-b border-border bg-secondary">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold uppercase tracking-tighter">
              {mode === "login" && "Sign In"}
              {mode === "register" && "Create Account"}
              {mode === "confirm" && "Confirm Email"}
            </DialogTitle>
            <button onClick={handleClose} className="p-2 hover:bg-background transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleSignUp : handleConfirmSignUp}>
          <div className="p-8 space-y-8">
            {error && (
              <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 border border-destructive/20">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-sm text-green-600 font-medium p-3 bg-green-50 border border-green-200">
                {success}
              </div>
            )}

            {mode === "confirm" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Confirmation Code
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter code from email"
                    className="rounded-none border-border h-12 text-xs font-bold tracking-widest uppercase"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="flex-1"
                  >
                    Resend Code
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode("login")}
                    disabled={loading}
                    className="flex-1"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Full Name (Optional)
                    </Label>
                    <Input
                      type="text"
                      placeholder="YOUR NAME"
                      className="rounded-none border-border h-12 text-xs font-bold tracking-widest uppercase"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    placeholder="EMAIL@DOMAIN.COM"
                    className="rounded-none border-border h-12 text-xs font-bold tracking-widest uppercase"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Input
                    type="password"
                    placeholder="********"
                    className="rounded-none border-border h-12 text-xs font-bold tracking-widest uppercase"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  {mode === "register" && (
                    <p className="text-[10px] text-muted-foreground">Must be at least 8 characters</p>
                  )}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                )}
              </div>
            )}

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-none bg-black text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-zinc-800 transition-all"
            >
              {loading ? "Loading..." : mode === "login" ? "Secure Login" : mode === "register" ? "Initialize Account" : "Confirm"}
            </Button>

            {mode !== "confirm" && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login")
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black underline underline-offset-4 transition-colors"
                >
                  {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
                </button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
