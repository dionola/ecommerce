import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export default function NotFound() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-24 flex flex-col items-center text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground mb-6">404</p>
      <h1 className="text-6xl font-bold uppercase tracking-tighter mb-4">Page Not Found</h1>
      <p className="text-muted-foreground mb-12 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild className="rounded-none h-14 px-12 text-xs font-bold uppercase tracking-[0.3em] bg-black hover:bg-zinc-900 text-white">
        <Link to="/">Back to Store</Link>
      </Button>
    </div>
  )
}
