import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTechnologyIcon, splitTechnologyMetadata } from '../src/lib/skill-icons.ts';
import { technologyGroups } from '../src/lib/technology-groups.ts';

const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url), 'utf8'));

test('every current technology has artwork and exactly one deliberate group', () => {
  const grouped = technologyGroups.flatMap(group => group.skills);
  assert.equal(new Set(grouped).size, grouped.length);
  for (const skill of Object.values(profile.skills).flat() as string[]) {
    assert.ok(getTechnologyIcon(skill), `${skill} has no technology artwork`);
    assert.equal(grouped.filter(name => name === skill).length, 1, `${skill} needs one group`);
  }
  for (const record of [...profile.experience, ...profile.projects]) {
    for (const skill of record.skills) assert.ok(getTechnologyIcon(skill), `Context rendered as a technology: ${skill}`);
    assert.equal(new Set(record.tags).size, record.tags.length);
  }
});

test('practices and React state-management concepts stay in shared metadata instead of icon tiles', () => {
  const context = ['React Context', 'useReducer', 'Accessibility', 'CI/CD', 'TDD', 'Mentoring'];
  assert.deepEqual(splitTechnologyMetadata(['React', ...context], ['Accessibility']), { skills: ['React'], tags: ['Accessibility', ...context.filter(name => name !== 'Accessibility')] });
  for (const name of context) assert.equal(getTechnologyIcon(name), undefined);
  for (const name of ['Assembled Financial', 'Assembled Brands']) {
    const role = profile.experience.find((item: { organization: string }) => item.organization === name);
    assert.ok(role.tags.includes('React state management (Context + useReducer)'));
    assert.ok(!role.skills.includes('useReducer'));
  }
});

test('new and legacy technology spellings resolve to their brand artwork', () => {
  for (const skill of ['Apache Solr', 'jQuery Mobile', 'GWT', 'Ruby', 'Jenkins', 'Ext JS', 'Spring Boot', 'jQuery', 'HTML5', 'CSS3', 'Groovy', 'Parcel', 'CircleCI', 'GitLab', 'GitHub Actions']) {
    const icon = getTechnologyIcon(skill);
    assert.ok(icon && (icon.path || icon.image), skill);
  }
  for (const [alias, canonical] of [['SOLR', 'Apache Solr'], ['Ext.js', 'Ext JS'], ['JQuery', 'jQuery'], ['HTML 5.0', 'HTML5'], ['CSS', 'CSS3'], ['React.js', 'React']]) {
    assert.equal(getTechnologyIcon(alias)?.id, getTechnologyIcon(canonical)?.id);
  }
  assert.notEqual(getTechnologyIcon('jQuery')?.id, getTechnologyIcon('jQuery Mobile')?.id);
  assert.deepEqual(splitTechnologyMetadata(['Unknown practice']), { skills: [], tags: ['Unknown practice'] });
});
