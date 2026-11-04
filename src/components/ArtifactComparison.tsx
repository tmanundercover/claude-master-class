import { useRef, useState } from 'react';
import type { SavedVersion, ArtifactKind } from '../lib/job-contracts';
function blocks(text: string) { return text.split(/\n\n+/).filter(Boolean); }
function sectionKey(text: string) { return text.match(/^#+\s+(.+)/)?.[1].toLowerCase() ?? null; }
export default function ArtifactComparison({ current, previous, workspaceId, kind }: { current: SavedVersion; previous: SavedVersion; workspaceId: string; kind: ArtifactKind }) {
  const [sync, setSync] = useState(false); const [tab, setTab] = useState<'current' | 'previous'>('current');
  const left = useRef<HTMLDivElement>(null); const right = useRef<HTMLDivElement>(null); const lock = useRef<HTMLDivElement | null>(null);
  function scroll(source: HTMLDivElement, target: HTMLDivElement | null) {
    if (!sync || !target || lock.current === source) return;
    const sourceSections = [...source.querySelectorAll<HTMLElement>('[data-section]')];
    const visible = sourceSections.filter(item => item.offsetTop <= source.scrollTop + 20).at(-1);
    const section = visible?.dataset.section; const match = section ? [...target.querySelectorAll<HTMLElement>('[data-section]')].find(item => item.dataset.section === section) : null;
    lock.current = target;
    target.scrollTop = match && visible ? match.offsetTop + (source.scrollTop - visible.offsetTop) : source.scrollTop / Math.max(1, source.scrollHeight - source.clientHeight) * (target.scrollHeight - target.clientHeight);
    requestAnimationFrame(() => { requestAnimationFrame(() => { lock.current = null; }); });
  }
  const currentBlocks = blocks(current.markdown); const previousBlocks = blocks(previous.markdown);
  const sections = (items: string[]) => { const counts = new Map<string, number>(); for (const block of items) { const key = sectionKey(block); if (key) counts.set(key, (counts.get(key) ?? 0) + 1); } return counts; };
  const currentSections = sections(currentBlocks); const previousSections = sections(previousBlocks);
  const sharedSections = new Set([...currentSections].filter(([key, count]) => count === 1 && previousSections.get(key) === 1).map(([key]) => key));
  return <section className="artifact-comparison" aria-label="Compare Current and Previous">
    <h3>Compare Current and Previous</h3>
    <label><input type="checkbox" checked={sync} onChange={event => setSync(event.target.checked)} /> Synchronize scrolling</label>
    <div className="version-tabs" role="tablist" aria-label="Document version">
      {(['current', 'previous'] as const).map(version => <button type="button" role="tab" aria-selected={tab === version} aria-controls={`compare-${version}`} id={`tab-${version}`} key={version} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const destination = event.key === 'Home' ? 'current' : event.key === 'End' ? 'previous' : version === 'current' ? 'previous' : 'current'; document.getElementById(`tab-${destination}`)?.click(); document.getElementById(`tab-${destination}`)?.focus(); } }} tabIndex={tab === version ? 0 : -1} onClick={() => { const source = version === 'current' ? left.current : right.current; const target = version === 'current' ? right.current : left.current; const progress = source ? source.scrollTop / Math.max(1, source.scrollHeight - source.clientHeight) : 0; setTab(version); requestAnimationFrame(() => { if (target) target.scrollTop = progress * Math.max(0, target.scrollHeight - target.clientHeight); }); }}> {version === 'current' ? 'Current' : 'Previous'} </button>)}
    </div>
    <div className="comparison-grid" data-tab={tab}>
      {([{ name: 'previous', saved: previous, ref: left, other: right, changed: currentBlocks }, { name: 'current', saved: current, ref: right, other: left, changed: previousBlocks }] as const).map(({ name, saved, ref, other, changed }) => <div key={name} className={`comparison-column comparison-${name}`} id={`compare-${name}`} role="tabpanel" aria-labelledby={`tab-${name}`}>
        <h4>{name === 'current' ? 'Current' : 'Previous'}</h4>
        <p className="muted">{saved.version.mode} · {new Date(saved.version.createdAt).toLocaleString()} · {saved.version.promptVersion}</p>
        {saved.version.changeMessage && <p>Requested changes: {saved.version.changeMessage}</p>}
        <div className="job-actions"><a href={`/api/job-workspaces/${workspaceId}/artifacts/${kind}/versions/${saved.version.id}/files/markdown`}>Download {name === 'current' ? 'Current' : 'Previous'} Markdown</a>{saved.version.pdf.state === 'ready' && <a href={`/api/job-workspaces/${workspaceId}/artifacts/${kind}/versions/${saved.version.id}/files/pdf`}>Download {name === 'current' ? 'Current' : 'Previous'} PDF</a>}</div>
        {/* Native overflow regions need keyboard focus for arrow/PageDown scrolling. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="comparison-scroll" ref={ref} tabIndex={0} role="region" aria-label={`${name} document`} onScroll={event => scroll(event.currentTarget, other.current)}>
          {blocks(saved.markdown).map((block, index) => <div className={changed.includes(block) ? '' : 'changed-block'} data-section={sharedSections.has(sectionKey(block) ?? '') ? sectionKey(block)! : undefined} key={index}>{block}</div>)}
        </div>
      </div>)}
    </div>
    <p className="muted">Highlighted paragraphs differ between versions. Scroll each document independently or enable synchronization.</p>
  </section>;
}
