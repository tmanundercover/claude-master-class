import type { Metadata } from "next";
import Link from "next/link";
import profile from "../../data/profile.json";
import "./globals.css";

export const metadata: Metadata = {
  title: `${profile.name} | Fullstack Engineer & AI Product Builder`,
  description: profile.pitch,
  authors: [{ name: profile.name }],
  creator: profile.name,
  openGraph: {
    title: `${profile.name} | Fullstack Engineer & AI Product Builder`,
    description: profile.pitch,
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <Link className="brand" href="/">{profile.name}<span> / portfolio</span></Link>
          <nav aria-label="Main navigation">
            <Link href="/#projects">Projects</Link>
            <Link href="/#contact">Contact</Link>
            <Link href="/interview">Interview room</Link>
            <Link href="/dashboard">Private workspace</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">Built from evidence. Improved through practice.</footer>
      </body>
    </html>
  );
}
