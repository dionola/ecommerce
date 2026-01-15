import { Navbar } from "../components/Navbar"
import { Hero } from "../components/Hero"
import { ProductGrid } from "../components/ProductGrid"
import { Footer } from "../components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <Hero />
      <ProductGrid defaultFiltersOpen={true} />
      <Footer />
    </main>
  )
}

