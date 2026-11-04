import AppLink from "@/components/AppLink";
import ToolWorkbench from "@/components/ToolWorkbench";
import { tools } from "@/lib/tools";

export default function ToolPage({ id }: { id: string }) {
  const tool = tools.find((item) => item.id === id);
  if (!tool) return <h1>Page not found</h1>;
  return (
    <>
      <p><AppLink href="/dashboard">Back to workspace</AppLink></p>
      <h1>{tool.title}</h1>
      <p>{tool.description}</p>
      <p className="notice">{tool.id === "fit-analyzer"
        ? "This protected tool compares the job description with verified profile evidence. Treat the score as an evidence-fit summary, not a hiring probability."
        : tool.id === "resume-tailor"
          ? "Start directly with a job description. Preview your tailored résumé, download HTML, or copy plain text. Source details and review notes stay outside your exports."
        : tool.id === "cover-letter"
          ? "This protected tool drafts from verified profile evidence. Review every detail and verification note before copying; it never sends or submits a letter."
          : "Choose interview preparation or a four-week study plan. Interview stages are assumptions to confirm, private notes stay in page state, and study plans respect the weekly time budget."}</p>
      <ToolWorkbench id={tool.id} />
    </>
  );
}
