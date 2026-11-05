import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { projectTargetId, relatedProjects } from '../src/lib/project-navigation.ts';
import type { PublicProfile } from '../src/app-types';

const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url), 'utf8')) as PublicProfile;

test('experience project references resolve to unique public fragment targets', () => {
  const ids = profile.projects.map(project => projectTargetId(project.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(id => /^project-[a-z0-9-]+$/.test(id)));
  for (const role of profile.experience) {
    const ids = role.projectIds ?? [];
    assert.equal(relatedProjects(ids, profile.projects).length, ids.length, role.organization);
    assert.equal(new Set(ids).size, ids.length);
  }
  const founder = profile.experience.find(role => role.organization === 'The Handsomest Nerd, LLC')!;
  assert.ok(relatedProjects(founder.projectIds, profile.projects).some(project => project.id === 'the-handsomest-nerd'));
  assert.deepEqual(relatedProjects(undefined, profile.projects), []);
  assert.deepEqual(relatedProjects(['missing'], profile.projects), []);
});
