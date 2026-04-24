interface AuthModeHeaderProps {
  mode: 'login' | 'register' | 'confirm'
}

export function AuthModeHeader({ mode }: AuthModeHeaderProps) {
  return (
    <>
      {mode === 'login' && 'Sign In'}
      {mode === 'register' && 'Create Account'}
      {mode === 'confirm' && 'Confirm Email'}
    </>
  )
}
