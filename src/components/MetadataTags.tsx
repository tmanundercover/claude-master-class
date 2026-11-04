/** Shared comma-separated metadata for experience and project context. */
export default function MetadataTags({ tags }: { tags: readonly string[] }) {
  const unique = [...new Set(tags)];
  if (!unique.length) return null;
  return <p className="metadata-tags" aria-label="Tags">
    <span className="sr-only">Tags: </span>
    {unique.map((tag, index) => <span key={tag}>{index > 0 && ', '}<span className="metadata-tag">
      <svg className="metadata-tags-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 3h7l11 11-7 7L3 10Z" /><circle cx="7.5" cy="7.5" r="1" />
      </svg>
      {tag}
    </span></span>)}
  </p>;
}
