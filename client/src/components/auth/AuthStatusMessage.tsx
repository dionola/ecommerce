interface AuthStatusMessageProps {
  error: string | null
  success: string | null
}

export function AuthStatusMessage({ error, success }: AuthStatusMessageProps) {
  if (error) {
    return (
      <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 border border-destructive/20">
        {error}
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-sm text-green-600 font-medium p-3 bg-green-50 border border-green-200">
        {success}
      </div>
    )
  }

  return null
}
