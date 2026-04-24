import {
  Box,
  ChefHat,
  Droplet,
  Lightbulb,
  Package,
  Shirt,
  Sofa,
  Sparkles,
  TreePine,
  Watch,
  Zap,
} from "lucide-react"

export const getCategoryIcon = (category: string): typeof Package => {
  const normalized = category.toLowerCase().trim()

  const iconMap: Record<string, typeof Package> = {
    furniture: Sofa,
    lighting: Lightbulb,
    decor: Sparkles,
    decoration: Sparkles,
    storage: Box,
    textiles: Shirt,
    textile: Shirt,
    kitchen: ChefHat,
    bathroom: Droplet,
    bath: Droplet,
    outdoor: TreePine,
    electronics: Zap,
    electronic: Zap,
    accessories: Watch,
    accessory: Watch,
  }

  return iconMap[normalized] || Package
}
