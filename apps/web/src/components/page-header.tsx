"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  className?: string;
  showEyebrowLine?: boolean;
  variant?: "hero" | "standard";
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
  showEyebrowLine = true,
  variant = "hero",
}: PageHeaderProps) {
  return (
    <header className={`welcome-row ${variant === "standard" ? "page-header-standard" : ""} ${className}`.trim()}>
      <div className="min-w-0">
        <div className="eyebrow">
          {showEyebrowLine && <span className="eyebrow-line" />}
          {eyebrow}
        </div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
