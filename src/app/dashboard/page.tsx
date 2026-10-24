import Link from "next/link";
import { tools } from "@/lib/tools";
import { privatePageGuard } from "@/lib/private-page";

export default async function Dashboard() {
  const blocked = await privatePageGuard();
  if (blocked) return blocked;
  return (
    <>
      <h1>Your next four builds.</h1>
      <p>One verified profile. One target job. Three private tools and one interview response library.</p>
      <p className="notice">This workspace is protected by a four-hour server session. All three tools use verified profile evidence, validate model output, and surface provider failures without fabricated fallback results.</p>
      <div className="grid three">
        {tools.map((tool, index) => <Link key={tool.id} className="panel tool-link" href={`/dashboard/${tool.id}`}>
          <span className="badge">Exercise {index + 1}</span><h2>{tool.title}</h2><p>{tool.description}</p><span>Open exercise workspace</span>
        </Link>)}
        <Link className="panel tool-link" href="/interview">
          <span className="badge">Exercise 4</span><h2>STAR Interview Responses</h2><p>Give recruiters and interviewers a searchable, evidence-linked library of recorded answers.</p><span>Open interview room</span>
        </Link>
      </div>
    </>
  );
}
