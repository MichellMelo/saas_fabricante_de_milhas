import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" className={cn(className)} {...props} />;
}
export function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol className={cn("flex flex-wrap items-center gap-1.5 break-words text-sm text-slate-500 sm:gap-2.5", className)} {...props} />;
}
export function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}
export function BreadcrumbLink({ className, ...props }: React.ComponentProps<"a">) {
  return <a className={cn("transition-colors hover:text-slate-900", className)} {...props} />;
}
export function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span aria-current="page" aria-disabled="true" className={cn("font-medium text-slate-900", className)} {...props} />;
}
export function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>{children ?? <ChevronRight />}</li>;
}
export function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return <span role="presentation" aria-hidden="true" className={cn("flex size-9 items-center justify-center", className)} {...props}><MoreHorizontal className="size-4" /><span className="sr-only">Mais</span></span>;
}
