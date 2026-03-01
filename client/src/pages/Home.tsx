import { Hero } from "../components/Hero"
import { ProductGrid } from "../components/ProductGrid"

export default function Home() {
  return (
    <>
      <Hero />
      <ProductGrid defaultFiltersOpen={true} />
    </>
  )
}
