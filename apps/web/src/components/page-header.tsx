"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
  showEyebrowLine?: boolean;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
  showEyebrowLine = true,
}: PageHeaderProps) {
  return (
    <header className={`welcome-row ${className}`.trim()}>
      <div className="min-w-0">
        <div className="eyebrow">
          {showEyebrowLine && <span className="eyebrow-line" />}
          {eyebrow}
        </div>
        <h1 className="page-title">
          {title}<span className="gold-period">.</span>
        </h1>
        <p className="page-subtitle">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
