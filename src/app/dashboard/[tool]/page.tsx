import { notFound } from "next/navigation";
import Link from "next/link";
import ToolWorkbench from "@/components/ToolWorkbench";
import { tools } from "@/lib/tools";
import { privatePageGuard } from "@/lib/private-page";

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const blocked = await privatePageGuard();
  if (blocked) return blocked;
  const { tool: id } = await params;
  const tool = tools.find((item) => item.id === id);
  if (!tool) notFound();
  return (
    <>
      <p><Link href="/dashboard">Back to workspace</Link></p>
      <h1>{tool.title}</h1>
      <p>{tool.description}</p>
      <p className="notice">{tool.id === "fit-analyzer"
        ? "This protected tool compares the job description with verified profile evidence. Treat the score as an evidence-fit summary, not a hiring probability."
        : tool.id === "cover-letter"
          ? "This protected tool drafts from verified profile evidence. Review every detail and verification note before copying; it never sends or submits a letter."
          : "Choose interview preparation or a four-week study plan. Interview stages are assumptions to confirm, private notes stay in page state, and study plans respect the weekly time budget."}</p>
      <ToolWorkbench id={tool.id} />
    </>
  );
}
