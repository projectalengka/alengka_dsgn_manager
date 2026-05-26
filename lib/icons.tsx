import {
  Sparkles, Shirt, PenTool, Laptop, Compass, Image as ImageIcon, Video,
  Layers, Palette, Briefcase, Brush, Smartphone, BookOpen, Tag, Scissors,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  Sparkles, Shirt, PenTool, Laptop, Compass, ImageIcon, Video,
  Layers, Palette, Briefcase, Brush, Smartphone, BookOpen, Tag, Scissors,
}

export function getIconComponent(name: string): LucideIcon {
  return iconMap[name] || Layers
}

export function renderIcon(name: string, className = "w-3.5 h-3.5 stroke-[1.5]") {
  const Icon = getIconComponent(name)
  return <Icon className={className} />
}
