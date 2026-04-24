import { User } from "lucide-react"
import { UserMenuItems } from "./userMenuItems"

interface UserMenuProps {
  isAuthenticated: boolean
  email?: string
  groups?: string[]
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onSignIn: () => void
  onSignOut: () => Promise<void>
  userDropdownRef: React.RefObject<HTMLDivElement | null>
}

export function UserMenu({
  isAuthenticated,
  email,
  groups,
  isOpen,
  onToggle,
  onClose,
  onSignIn,
  onSignOut,
  userDropdownRef,
}: UserMenuProps) {
  const isAdmin = groups?.includes("admin") ?? false
  const isSuperAdmin = groups?.includes("superadmin") ?? false

  if (!isAuthenticated) {
    return (
      <button
        onClick={onSignIn}
        className="p-2 hover:bg-secondary transition-colors rounded-full relative"
        title="Sign in"
      >
        <User className="w-5 h-5 opacity-50" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-gray-400 rounded-full border-2 border-background" title="Not signed in" />
      </button>
    )
  }

  return (
    <div className="relative" ref={userDropdownRef}>
      <button
        onClick={onToggle}
        className="p-2 hover:bg-secondary transition-colors rounded-full relative"
        title={email || "User account"}
      >
        <User className="w-5 h-5" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-background" title="Signed in" />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-background border border-border shadow-lg min-w-[240px] z-50 rounded-md">
          <div className="py-2">
            {email && (
              <div className="px-4 py-2 border-b border-border">
                <div className="text-sm font-medium">{email}</div>
                {groups && groups.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">{groups.join(", ")}</div>
                )}
              </div>
            )}

            <UserMenuItems isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} onNavigate={onClose} />
            <div className="border-t border-border my-1" />
            <button onClick={onSignOut} className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
