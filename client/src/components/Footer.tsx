import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-20 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-6">
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85]">
              Stay <br /> Informed
            </h2>
            <div className="mt-8 max-w-md">
              <p className="text-background/60 uppercase text-xs tracking-widest mb-6 leading-relaxed">
                Subscribe to our newsletter for early access to collection launches and exclusive archive sales.
              </p>
              <form className="flex gap-4 border-b border-background/20 pb-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  className="bg-transparent border-none outline-none text-xs tracking-widest uppercase w-full placeholder:text-background/30"
                />
                <button type="submit" className="text-xs font-bold uppercase tracking-widest hover:text-background/60 transition-colors">
                  Submit
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-2 gap-8 md:justify-end">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-background/40">Navigation</h3>
              <ul className="space-y-2 text-sm uppercase tracking-widest font-medium">
                <li>
                  <Link to="/" className="hover:text-background/60 transition-colors">
                    Collection
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-background/60 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-background/60 transition-colors">
                    Shipping
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-background/60 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-background/40">Social</h3>
              <ul className="space-y-2 text-sm uppercase tracking-widest font-medium">
                <li>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-background/60 transition-colors">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:text-background/60 transition-colors">
                    Pinterest
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-background/60 transition-colors">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-background/10">
          <p className="text-[10px] tracking-widest uppercase font-bold text-background/40">
            © 2026 Objekt Studio. All Rights Reserved.
          </p>
          <div className="text-5xl font-bold tracking-tighter uppercase opacity-10">Objekt</div>
          <p className="text-[10px] tracking-widest uppercase font-bold text-background/40">
            Terms — Privacy — Cookies
          </p>
        </div>
      </div>
    </footer>
  )
}

