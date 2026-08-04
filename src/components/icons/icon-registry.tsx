import {
  LayoutDashboard,
  Store,
  ClipboardList,
  ChefHat,
  Receipt,
  Users,
  FileBarChart,
  BarChart3,
  Table2,
  UtensilsCrossed,
  FolderTree,
  Settings,
  UserRound,
  Bell,
  Search,
  Calendar,
  Clock,
  Wallet,
  ShoppingCart,
  Printer,
  FileText,
  Boxes,
  Package,
  Truck,
  BadgePercent,
  CircleDollarSign,
  CreditCard,
  UserCog,
  Shield,
  Moon,
  Upload,
  Download,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Filter,
  ArrowUpDown,
  FileDown,
  FileUp,
  Plus,
  Minus,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

export const iconRegistry = {
  dashboard: LayoutDashboard,
  restaurant: Store,
  order: ClipboardList,
  kitchen: ChefHat,
  billing: Receipt,
  customer: Users,
  report: FileBarChart,
  analytics: BarChart3,
  table: Table2,
  menu: UtensilsCrossed,
  category: FolderTree,
  settings: Settings,
  profile: UserRound,
  notification: Bell,
  search: Search,
  calendar: Calendar,
  clock: Clock,
  money: Wallet,
  cart: ShoppingCart,
  printer: Printer,
  receipt: FileText,
  inventory: Boxes,
  package: Package,
  delivery: Truck,
  discount: BadgePercent,
  tax: CircleDollarSign,
  payment: CreditCard,
  staff: UserCog,
  role: Shield,
  security: Shield,
  theme: Moon,
  upload: Upload,
  download: Download,
  refresh: RefreshCw,
  edit: Pencil,
  delete: Trash2,
  view: Eye,
  filter: Filter,
  sort: ArrowUpDown,
  export: FileDown,
  import: FileUp,
  plus: Plus,
  minus: Minus,
  check: Check,
  close: X,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconRegistry;

type AppIconProps = {
  name: IconName;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
};

export function AppIcon({
  name,
  className,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
}: AppIconProps) {
  const Icon = iconRegistry[name];
  return (
    <Icon
      className={className}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    />
  );
}

export function getIcon(name: IconName): LucideIcon {
  return iconRegistry[name];
}
