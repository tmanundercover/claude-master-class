import type { EvidenceStatus, FitReference, FitResult, LogisticsFit } from '@/lib/fit-types';

const evidenceLabels: Record<EvidenceStatus, string> = {
  supported: 'Supported', partially_supported: 'Partially supported', unsupported_evidence: 'Unsupported evidence',
};
const logisticsLabels = { compatible: 'Compatible', incompatible: 'Conflict', needs_confirmation: 'Needs confirmation', not_stated: 'Not stated' };
function ProfileReferences({ references }: { references: FitReference[] }) {
  return references.length ? <ul className="fit-references" aria-label="Profile references">
    {references.map(reference => <li key={reference.id}><details>
      <summary>{reference.label}</summary><p>{reference.text}</p>
    </details></li>)}
  </ul> : <p className="muted">No supporting profile evidence cited.</p>;
}
function LogisticsAssessment({ title, value }: { title: string; value: LogisticsFit }) {
  return <article className="fit-logistics-card">
    <h4>{title}</h4><span className={`fit-status fit-status--${value.status}`}>{logisticsLabels[value.status]}</span>
    {value.requirement && <p><strong>{value.requirement}</strong></p>}
    {value.jobQuote && <blockquote>{value.jobQuote}</blockquote>}
    <p>{value.rationale}</p>
    {value.references.length > 0 && <ProfileReferences references={value.references} />}
  </article>;
}
export default function FitAnalysisResult({ result }: { result: FitResult }) {
  return <section className="fit-result" aria-labelledby="fit-result-heading">
    <div className="fit-summary">
      <div className="fit-score" aria-label={result.score === null ? 'No scorable requirements stated' : `Technical and role fit: ${result.score} out of 100`}>
        <strong>{result.score ?? '—'}</strong>{result.score !== null && <span>/100</span>}
      </div>
      <div>
        <h2 id="fit-result-heading">Technical &amp; role fit</h2>
        <p>{result.summary}</p>
        <p className="muted">Calculated from the requirement classifications below. Location and work arrangement are assessed separately. This is evidence fit, not a hiring probability.</p>
      </div>
    </div>
    <section aria-labelledby="fit-breakdown-heading">
      <h3 id="fit-breakdown-heading">Scoring breakdown</h3>
      <p>Supported earns 1 point, partially supported earns 0.5, and unsupported evidence earns 0. Each category averages its requirements, then applies its weight.</p>
      {result.score === null ? <p className="notice">No scorable qualifications or responsibilities were identified. There is no technical fit score for this posting.</p>
        : result.breakdown.some(group => group.total === 0) && <p className="muted">Categories with no stated requirements are excluded. The remaining weights are scaled to total 100%.</p>}
      <div className="fit-breakdown-grid">
        {result.breakdown.map(group => <article className="fit-breakdown-card" key={group.category}>
          <h4>{group.label}</h4>
          <dl>
            <dt>Base weight</dt><dd>{group.weight}%</dd>
            <dt>Applied weight</dt><dd>{group.effectiveWeight}%</dd>
            <dt>Requirements</dt><dd>{group.total}</dd>
            <dt>Category fit</dt><dd>{group.score === null ? 'Not stated' : `${group.score}%`}</dd>
            <dt>Score contribution</dt><dd>{group.contribution} / 100</dd>
          </dl>
          {group.total > 0 && <p className="muted">{group.supported} supported · {group.partial} partial · {group.unsupported} unsupported</p>}
        </article>)}
      </div>
    </section>
    <section aria-labelledby="fit-requirements-heading">
      <h3 id="fit-requirements-heading">Requirement evidence</h3>
      {result.breakdown.filter(group => group.total > 0).map(group => <section className="fit-requirement-group" key={group.category}>
        <h4>{group.label}</h4>
        <ol className="fit-requirement-list">
          {result.requirements.filter(item => item.category === group.category).map((item, index) => <li key={`${item.requirement}-${index}`}>
            <div className="fit-requirement-heading"><strong>{item.requirement}</strong><span className={`fit-status fit-status--${item.status}`}>{evidenceLabels[item.status]}</span></div>
            <blockquote>{item.jobQuote}</blockquote>
            <p>{item.rationale}</p>
            <ProfileReferences references={item.references} />
          </li>)}
        </ol>
      </section>)}
    </section>
    <section aria-labelledby="fit-logistics-heading">
      <h3 id="fit-logistics-heading">Location &amp; work-arrangement fit</h3>
      <p className="muted">These assessments do not add to or subtract from the technical and role fit score.</p>
      <div className="fit-columns">
        <LogisticsAssessment title="Location" value={result.location} />
        <LogisticsAssessment title="Work arrangement" value={result.workArrangement} />
      </div>
    </section>
    <section><h3>Three next actions</h3><ol>{result.nextActions.map((action, index) => <li key={`${action}-${index}`}>{action}</li>)}</ol></section>
  </section>;
}
