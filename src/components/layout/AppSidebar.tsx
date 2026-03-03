"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Users,
  Coins,
  Ticket,
  Store,
  ShieldAlert,
  Settings,
  Image as ImageIcon,
  TrendingUp,
  Calculator
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const adminMenu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/",
  },
  {
    title: "Obras (Works)",
    icon: Library,
    url: "/works",
  },
  {
    title: "Usuários",
    icon: Users,
    url: "/users",
  },
  {
    title: "Transações",
    icon: Coins,
    url: "/finance/transactions",
  },
  {
    title: "BI: Faturamento de Obras",
    icon: TrendingUp,
    url: "/finance/works",
  },
  {
    title: "Cupons Promocionais",
    icon: Ticket,
    url: "/finance/promo-codes",
  },
  {
    title: "Contabilidade (Contador)",
    icon: Calculator,
    url: "/finance/accounting",
  },
  {
    title: "Loja & Cosméticos",
    icon: Store,
    url: "/shop/cosmetics",
  },

  {
    title: "Denúncias (Reports)",
    icon: ShieldAlert,
    url: "/moderation/reports",
  },
  {
    title: "Configurações",
    icon: Settings,
    url: "/settings",
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="glass-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            GC
          </div>
          <span className="font-bold text-lg truncate flex-1 group-data-[collapsible=icon]:hidden">
            Gato Comics
          </span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenu.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
