// Imported only into a temporary generated Functions bundle by the emulator test harness.
// Source/runtime code has no fixture mode. The harness restores that bundle in finally.
export async function emulatorModelFixture(request, { ModelError }) {
  const input = JSON.parse(request.prompt);
  const jd = input.untrustedJobDescription;
  if (jd.includes('[fixture:rate-limit]')) throw new ModelError('Controlled provider rate limit.', 429, '17');
  if (jd.includes('[fixture:provider-error]')) throw new ModelError('Controlled provider failure.', 502);
  if (jd.includes('[fixture:malformed]')) return { incomplete: true };
  if (request.schema.properties.headline) {
    const evidence = input.verifiedCandidateEvidence;
    if (!evidence.sources.some(source => source.text.length > 30)) throw new Error('Readable evidence is required.');
    const role = evidence.experience[0], project = evidence.projects[0];
    const prose = (text, reference = `${role.id}-summary`) => ({ text, references: [reference] });
    return {
      headline: prose('Software Engineer · Business Applications & Automation'),
      summary: prose('Builds dependable business applications and operational workflows with React, TypeScript, and Firebase.'),
      skills: evidence.skills.slice(0, 8).map(skill => skill.id),
      experience: [{ id: role.id, summary: prose('Develops applications and advises teams on automation, reporting, integrations, and staff enablement.'),
        bullets: [prose('Built allocation and approval workflows for employees, managers, and finance administrators.', `${role.id}-bullet-2`)] }],
      projects: [{ id: project.id, description: prose('Developed a property-listing website with a custom CMS and integrated contact delivery.', `${project.id}-summary`) }],
      factsToVerify: ['CONTROLLED-REVIEW-NOTE: Confirm the target team’s application priorities.'],
    };
  }
  if (request.schema.properties.requirements) {
    const notStated = { requirement: null, jobQuote: null, status: 'not_stated', rationale: 'The posting does not state a constraint.', references: [] };
    const result = {
      summary: 'React application work is documented. Kubernetes evidence is absent; confirm relocation and the hybrid schedule.',
      requirements: [
        { requirement: 'React', jobQuote: 'React', category: 'required_technical', status: 'supported', rationale: 'React is listed in the verified profile.', references: [input.verifiedProfile.sources.find(source => source.text === 'React').id] },
        ...(jd.includes('Build business applications') ? [{ requirement: 'Build business applications', jobQuote: 'Build business applications', category: 'responsibilities_seniority', status: 'partially_supported', rationale: 'Application delivery is documented; confirm the target scope.', references: ['role-1-summary'] }] : []),
        ...(jd.includes('Kubernetes') ? [{ requirement: 'Kubernetes', jobQuote: 'Kubernetes', category: 'preferred', status: 'unsupported_evidence', rationale: 'The supplied profile has no Kubernetes evidence.', references: [] }] : []),
      ],
      location: jd.includes('Boston') ? { requirement: 'Boston', jobQuote: 'Boston', status: 'needs_confirmation', rationale: 'The profile is open to relocation; this move needs confirmation.', references: ['profile-summary', 'profile-location'] } : notStated,
      workArrangement: jd.includes('three days on site') ? { requirement: 'Hybrid schedule', jobQuote: 'three days on site', status: 'needs_confirmation', rationale: 'The profile does not establish this schedule preference.', references: [] } : notStated,
      nextActions: ['Discuss React work.', 'Clarify application scope.', 'Confirm relocation and hybrid expectations.'],
    };
    if (jd.includes('[fixture:fit-logistics-only]')) result.requirements = [];
    if (jd.includes('[fixture:fit-unknown-reference]')) result.requirements[0].references = ['invented-source'];
    if (jd.includes('[fixture:fit-provider-score]')) result.score = 100;
    return result;
  }
  if (request.schema.properties.letter) return {
    letter: Array.from({ length: 20 }, () => 'I build dependable business applications and practical workflows for teams.').join(' '),
    evidenceUsed: ['Business allocation workflows at Addition.', 'Property-listing website with contact delivery.'], factsToVerify: [],
  };
  if (input.requestedMode === 'interview') return {
    mode: 'interview', stagesToConfirm: ['Assumption to confirm with recruiter: technical discussion'],
    questions: ['Discuss React?', 'Discuss testing?', 'Discuss integrations?', 'Discuss delivery?', 'Discuss collaboration?'],
    stories: [1, 2, 3].map(() => ({ situation: 'Business reporting needed a workflow.', task: 'Build the workflow.', action: 'Implemented allocation and approvals.', result: 'Delivered a usable workflow.' })),
    questionsToAsk: ['What matters first?', 'How does the team deliver?', 'How is impact assessed?'], notesTemplate: ['Questions asked:', 'Follow-up commitments:'],
  };
  return { mode: 'study', roleSummary: 'Prepare relevant engineering demonstrations.', prioritySkills: ['React', 'Testing', 'Integrations'],
    weeks: [1, 2, 3, 4].map(week => ({ week, tasks: ['Build and explain a demonstration.'], hours: input.weeklyHours, deliverable: `Demonstration ${week}`, check: 'Pass five tests and explain the design.' })),
    readinessCheck: 'Self-assessment, not a guarantee: explain and demonstrate the completed work.' };
}
