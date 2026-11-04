import test from 'node:test';
import assert from 'node:assert/strict';
import { sortSkillsByExperience } from '../src/lib/skill-ranking.ts';

test('skills rank by documented years, with alphabetical ties and unrecorded totals last', () => {
  const skills = ['Unknown', 'React', 'Python', 'JavaScript', 'Figma', 'CodeSandbox'];
  const original = [...skills];
  const ranked = sortSkillsByExperience(skills, {
    React: { documentedRoleYears: 8 },
    Python: { documentedRoleYears: 8 },
    JavaScript: { documentedRoleYears: 15.1 },
    Figma: { documentedRoleYears: 0 },
  });
  assert.deepEqual(ranked, ['JavaScript', 'Python', 'React', 'CodeSandbox', 'Figma', 'Unknown']);
  assert.deepEqual(skills, original);
});
