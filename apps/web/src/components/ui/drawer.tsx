"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type DrawerContextValue = { open: boolean; setOpen: (open: boolean) => void };
const DrawerContext = React.createContext<DrawerContextValue | null>(null);
function useDrawer() {
  const value = React.useContext(DrawerContext);
  if (!value) throw new Error("Drawer components must be used inside <Drawer>.");
  return value;
}

export function Drawer({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return <DrawerContext.Provider value={{ open, setOpen: onOpenChange }}>{children}</DrawerContext.Provider>;
}
export function DrawerContent({ className, children, side = "right" }: { className?: string; children: React.ReactNode; side?: "right" | "bottom" }) {
  const { open, setOpen } = useDrawer();
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [open, setOpen]);
  return <AnimatePresence>
    {open && <>
      <motion.button type="button" aria-label="Fechar painel de detalhes" className="fixed inset-0 z-50 cursor-default bg-slate-950/30 backdrop-blur-[5px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={() => setOpen(false)} />
      <motion.aside role="dialog" aria-modal="true" className={cn("fixed z-[51] flex flex-col overflow-hidden bg-white shadow-2xl outline-none", side === "right" ? "inset-y-2 right-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] max-w-[460px] rounded-[28px] border border-slate-200 sm:inset-y-3 sm:right-3 sm:h-[calc(100%-1.5rem)] sm:w-[min(460px,calc(100%-1.5rem))]" : "inset-x-2 bottom-2 max-h-[90vh] w-[calc(100%-1rem)] rounded-[28px] border border-slate-200 sm:inset-x-3 sm:bottom-3 sm:w-[calc(100%-1.5rem)]", className)} initial={side === "right" ? { x: "100%" } : { y: "100%" }} animate={side === "right" ? { x: 0 } : { y: 0 }} exit={side === "right" ? { x: "100%" } : { y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
        {children}
      </motion.aside>
    </>}
  </AnimatePresence>;
}
export function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props}/>; }
export function DrawerTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h2 className={cn("text-lg font-semibold text-slate-900", className)} {...props}/>; }
export function DrawerDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("text-sm text-slate-500", className)} {...props}/>; }
export function DrawerClose({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { const { setOpen } = useDrawer(); return <button type="button" className={className} onClick={() => setOpen(false)} {...props}>{children}</button>; }
