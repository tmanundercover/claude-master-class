import type { ReactNode } from "react";
import type { PageData } from "./app-types";
import AppLink from "./components/AppLink";
import LogoutButton from "./components/LogoutButton";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tool from "./pages/Tool";
import Resume from "./pages/Resume";
import Interview from "./pages/Interview";
import profile from "../data/profile.json";

function Workspace({ children }: { children: ReactNode }) {
  return <main id="main" className="workspace">
    <div className="workspace-header"><p className="eyebrow">Private career workspace</p><LogoutButton /></div>
    {children}
  </main>;
}

function Page({ data }: { data: PageData }) {
  switch (data.page) {
    case "home": return <Home {...data.home} />;
    case "login": return <Login hasWelcomeVideo={data.hasWelcomeVideo} />;
    case "dashboard": return <Workspace><Dashboard evidence={data.evidence} /></Workspace>;
    case "tool": return <Workspace><Tool id={data.id} /></Workspace>;
    case "resume": return <Workspace><Resume {...data.resume} /></Workspace>;
    case "interview": return <Interview {...data.interview} />;
    case "configuration": return <main id="main" className="workspace">
      <h1>Configure your private workspace</h1>
      <p className="error" role="alert">Configure Firebase Authentication in the Functions backend and enable the Auth emulator locally. The public portfolio does not require login.</p>
    </main>;
    case "static-unavailable": return <main id="main" className="workspace">
      <h1>The private workspace needs Firebase Functions</h1>
      <p>This GitHub Pages site hosts the public portfolio. Login, the interview room, and AI tools run in Firebase Functions.</p>
      <p>To use the private workspace locally, run <code>npm run dev</code> in the project folder and open the URL printed in the terminal.</p>
      <AppLink className="button" href="/">Back to portfolio</AppLink>
    </main>;
    case "not-found": return <main id="main" className="workspace"><h1>Page not found</h1><AppLink href="/">Back to portfolio</AppLink></main>;
  }
}

export default function App({ data }: { data: PageData }) {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <AppLink className="brand" href="/">{profile.name}<span> / portfolio</span></AppLink>
      <nav aria-label="Main navigation">
        <AppLink href="/#projects">Projects</AppLink>
        <AppLink href="/#contact">Contact</AppLink>
        <AppLink href="/interview">Interview room</AppLink>
        <AppLink href="/dashboard">Private workspace</AppLink>
      </nav>
    </header>
    <Page data={data} />
    <footer className="site-footer">Built from evidence. Improved through practice.</footer>
  </>;
}
