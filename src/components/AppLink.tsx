import type { ComponentProps } from "react";
import { sitePath } from "@/lib/site-path";

export default function AppLink({ href, children, ...props }: ComponentProps<"a"> & { href: string }) {
  return <a {...props} href={sitePath(href)}>{children}</a>;
}
