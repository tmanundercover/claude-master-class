import type { ReactNode } from "react";
import type { PageData, PublicProfile } from "./app-types";
import AppLink from "./components/AppLink";
import LogoutButton from "./components/LogoutButton";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tool from "./pages/Tool";
import Resume from "./pages/Resume";
import Inbox from "./pages/Inbox";
import Interview from "./pages/Interview";

import Jobs from "./pages/Jobs";
import JobWorkspace from "./pages/JobWorkspace";
import ProfileAvatar from './components/ProfileAvatar';

function Workspace({ children, profile }: { children: ReactNode; profile: PublicProfile }) {
  return <main id="main" className="workspace">
    <div className="workspace-header"><div className="workspace-identity"><ProfileAvatar name={profile.name} initials={profile.initials} className="workspace-account-avatar" /><div><p className="eyebrow">Private workspace</p><span>{profile.name}</span></div></div><LogoutButton /></div>
    {children}
  </main>;
}

function Page({ data, profile }: { data: PageData; profile: PublicProfile }) {
  switch (data.page) {
    case "home": return <Home {...data.home} profile={profile} />;
    case "login": return <Login hasWelcomeVideo={data.hasWelcomeVideo} />;
    case "dashboard": return <Workspace profile={profile}><Dashboard evidence={data.evidence} profile={profile} /></Workspace>;
    case "inbox": return <main id="main" className="workspace inbox-workspace"><Inbox profile={profile} /></main>;
    case "jobs": return <Workspace profile={profile}><Jobs /></Workspace>;
    case "job": return <Workspace profile={profile}><JobWorkspace id={data.id} /></Workspace>;
    case "tool": return <Workspace profile={profile}><Tool id={data.id} /></Workspace>;
    case "resume": return <Workspace profile={profile}><Resume {...data.resume} /></Workspace>;
    case "interview": return <Interview {...data.interview} />;
    case "configuration": return <main id="main" className="workspace">
      <h1>Configure your private workspace</h1>
      <p className="error" role="alert">Configure Firebase Authentication in the Functions backend and enable the Auth emulator locally. The public portfolio does not require login.</p>
    </main>;
    case "static-unavailable": return <main id="main" className="workspace">
      <h1>The private workspace needs Firebase Functions</h1>
      <p>This GitHub Pages site hosts the public portfolio. Login, the interview room, email, and AI tools run in Firebase Functions.</p>
      <p>To use the private workspace locally, run <code>npm run dev</code> in the project folder and open the URL printed in the terminal.</p>
      <AppLink className="button" href="/">Back to portfolio</AppLink>
    </main>;
    case "not-found": return <main id="main" className="workspace"><h1>Page not found</h1><AppLink href="/">Back to portfolio</AppLink></main>;
  }
}

export default function App({ data, profile }: { data: PageData; profile: PublicProfile }) {
  const ownerView = data.page === "jobs" || data.page === "job" || data.page === "dashboard" || data.page === "inbox" || data.page === "tool" || data.page === "resume"
    || (data.page === "interview" && data.interview.role === "terrell");
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className={`site-header ${data.page === "inbox" ? "mail-site-header" : ""}`}>
      <AppLink className="brand" href="/">{profile.name}<span> / portfolio</span></AppLink>
      <nav aria-label="Main navigation">
        <AppLink href="/#projects">Projects</AppLink>
        <AppLink href="/#contact">Contact</AppLink>
        <AppLink href="/interview">Interview answers</AppLink>
        {ownerView ? <AppLink href="/dashboard">My workspace</AppLink> : data.page !== "interview" && <AppLink href="/login">Log in</AppLink>}
      </nav>
    </header>
    <Page data={data} profile={profile} />
    {data.page !== "inbox" && <footer className="site-footer">Built from evidence. Improved through practice.</footer>}
  </>;
}
