"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SidebarContextValue = { mobileOpen: boolean; setMobileOpen: (open: boolean) => void };
const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children, mobileOpen = false, setMobileOpen = () => undefined, className }: {
  children: React.ReactNode;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      <div data-sidebar="provider" className={cn("flex min-h-svh w-full", className)}>{children}</div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children, className, mobileOpen, ...props }: React.HTMLAttributes<HTMLElement> & { mobileOpen?: boolean }) {
  const context = React.useContext(SidebarContext);
  const isMobileOpen = mobileOpen ?? context?.mobileOpen ?? false;
  return (
    <aside
      data-sidebar="sidebar"
      data-state={isMobileOpen ? "open" : "closed"}
      className={cn(
        "group/sidebar fixed inset-y-0 left-0 z-40 flex h-dvh w-[16rem] flex-col overflow-hidden border-r border-white/10 bg-[#101b2d] text-slate-300 shadow-xl transition-transform duration-200 ease-out md:translate-x-0 md:shadow-none",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="header" className={cn("flex flex-col gap-2 px-5 pb-7 pt-6", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="content" className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-visible px-3 py-2", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="footer" className={cn("mt-auto flex flex-col gap-3 p-3", className)} {...props} />;
}

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section data-sidebar="group" className={cn("flex min-w-0 flex-col gap-2", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="group-label" className={cn("px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1.5", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li data-sidebar="menu-item" className={cn("group/menu-item relative min-w-0", className)} {...props} />;
}

export function SidebarMenuButton({ children, isActive = false, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) {
  return (
    <button
      data-sidebar="menu-button"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "peer/menu-button flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#c6a45c]/70 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "border border-white/10 bg-white/[.09] text-white shadow-sm before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded-r before:bg-[#c6a45c]"
          : "text-slate-300 hover:bg-white/[.055] hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="separator" role="separator" className={cn("mx-1 h-px bg-white/10", className)} {...props} />;
}
