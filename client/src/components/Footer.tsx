import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-20 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-6">
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85]">
              Test <br /> Storefront
            </h2>
            <div className="mt-8 max-w-md">
              <p className="text-background/60 uppercase text-xs tracking-widest mb-6 leading-relaxed">
                dionola is Stephen's test e-commerce site built with items from the H&amp;M dataset sample.
              </p>
              <div className="space-y-2 border-b border-background/20 pb-4 text-xs uppercase tracking-widest text-background/50">
                <p>Built for UI, cart, checkout, and admin workflow testing.</p>
                <a
                  href="https://github.com/luminati-io/HM-dataset-sample"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex hover:text-background/80 transition-colors"
                >
                  View dataset source
                </a>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-2 gap-8 md:justify-end">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-background/40">Navigation</h3>
              <ul className="space-y-2 text-sm uppercase tracking-widest font-medium">
                <li>
                  <Link to="/" className="hover:text-background/60 transition-colors">
                    Catalog
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
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-background/40">Resources</h3>
              <ul className="space-y-2 text-sm uppercase tracking-widest font-medium">
                <li>
                  <a
                    href="https://github.com/luminati-io/HM-dataset-sample"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-background/60 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/luminati-io/HM-dataset-sample"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-background/60 transition-colors"
                  >
                    HM Dataset
                  </a>
                </li>
                <li>
                  <Link to="/about" className="hover:text-background/60 transition-colors">
                    About Demo
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/luminati-io/HM-dataset-sample"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-background/60 transition-colors"
                  >
                    Dataset Source
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-background/10">
          <p className="text-[10px] tracking-widest uppercase font-bold text-background/40">
            © 2026 dionola. Stephen's test e-commerce site.
          </p>
          <div className="text-5xl font-bold tracking-tighter uppercase opacity-10">dionola</div>
          <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase font-bold text-background/40">
            <Link to="/returns" className="hover:text-background/60 transition-colors">
              Returns
            </Link>
            <span>•</span>
            <Link to="/shipping" className="hover:text-background/60 transition-colors">
              Shipping
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-background/60 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
