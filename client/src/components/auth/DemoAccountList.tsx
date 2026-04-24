interface DemoAccount {
  label: string
  email: string
  password: string
  note: string
}

interface DemoAccountListProps {
  accounts: DemoAccount[]
  onSelect: (account: DemoAccount) => void
}

export function DemoAccountList({ accounts, onSelect }: DemoAccountListProps) {
  return (
    <div className="border border-border bg-secondary/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Demo Accounts
          </p>
          <p className="text-xs text-muted-foreground">
            Use a seeded account for quick testing.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => onSelect(account)}
            className="w-full text-left border border-border bg-background px-3 py-3 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">{account.label}</p>
                <p className="text-xs text-muted-foreground">{account.email}</p>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {account.note}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
