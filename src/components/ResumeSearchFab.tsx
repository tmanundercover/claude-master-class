import { sitePath } from "@/lib/site-path";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ResumeSearchItem } from "@/lib/resume-evidence";

const resultKinds = ["All", "Experience", "Skill", "Project", "Education"] as const;

function matchesTerms(item: ResumeSearchItem, query: string): boolean {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean).every((term) => item.searchText.includes(term));
}

export default function ResumeSearchFab({ items }: { items: ResumeSearchItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof resultKinds)[number]>("All");

  const results = useMemo(() => items
    .filter((item) => kind === "All" || item.kind === kind)
    .filter((item) => matchesTerms(item, query))
    .slice(0, query.trim() ? 24 : 10), [items, kind, query]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      dialogRef.current?.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  function openDialog() {
    dialogRef.current?.showModal();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <>
      <button className="resume-search-fab" type="button" onClick={openDialog} aria-label="Search this resume">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.25 4.25" /></svg>
        <span>Search résumé</span>
      </button>
      <dialog
        className="resume-search-dialog"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="resume-search-shell">
          <div className="dialog-heading">
            <div>
              <p className="eyebrow">Search the full record</p>
              <h2>Find a skill, role, or project</h2>
            </div>
            <button className="icon-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close resume search">×</button>
          </div>
          <div className="resume-search-controls">
            <label>
              <span className="sr-only">Search résumé</span>
              <input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try React, fintech, AWS, or 2007…" />
            </label>
            <div className="resume-search-kinds" aria-label="Filter search results">
              {resultKinds.map((option) => (
                <button className={kind === option ? "active" : ""} type="button" key={option} onClick={() => setKind(option)}>{option}</button>
              ))}
            </div>
          </div>
          <p className="resume-search-count"><strong>{results.length}</strong> {results.length === 1 ? "match" : "matches"}{!query.trim() ? " shown from the résumé index" : ""}</p>
          <div className="resume-search-results">
            {results.map((item) => {
              const external = item.href.startsWith("http");
              return (
                <a className="resume-search-result" href={sitePath(item.href)} key={item.id} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} onClick={() => !external && dialogRef.current?.close()}>
                  <span className="resume-search-kind">{item.kind}</span>
                  <span className="resume-search-copy">
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                    <span>{item.description}</span>
                    {item.metadata.length > 0 && <span className="resume-search-meta">{item.metadata.slice(0, 5).join(" · ")}</span>}
                  </span>
                  <span aria-hidden="true">↗</span>
                </a>
              );
            })}
            {results.length === 0 && <div className="empty-state"><h3>No matching evidence</h3><p className="muted">Try a technology, company, job title, or project name.</p></div>}
          </div>
          <p className="resume-search-footnote">Historical dates and self-ratings come from the archived Sanity résumé. Current profile entries remain the primary résumé record.</p>
        </div>
      </dialog>
    </>
  );
}
