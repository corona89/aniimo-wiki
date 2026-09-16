import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  hover = false,
  className = "",
  children,
}: {
  hover?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`wiki-card ${hover ? "card-hover" : ""} ${className}`}>{children}</div>;
}

export function LinkCard({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`wiki-card card-hover block ${className}`}>
      {children}
    </Link>
  );
}
