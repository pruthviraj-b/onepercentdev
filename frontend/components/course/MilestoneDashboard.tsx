'use client';

import { useMemo } from 'react';
import type { Module } from '@/services/courseService';
import { isPartComplete } from '@/services/courseService';
import { getMilestones, isMilestoneComplete, isMilestoneUnlocked, milestoneParts } from '@/features/certificates/milestones';
import { MilestoneIcon } from '@/components/course/MilestoneIcon';

export function MilestoneDashboard({ courseId, modules, completedParts, progressPct }: { courseId: string; modules: Module[]; completedParts: number[]; progressPct: number }) {
  const milestones = useMemo(() => getMilestones(courseId).map((definition, index) => {
    const grouped = modules.filter(module => definition.moduleIds.includes(module.id));
    const parts = milestoneParts(grouped, definition);
    const doneParts = parts.filter(part => completedParts.includes(part)).length;
    const completedModules = grouped.filter(module => module.notes.flatMap(note => [note, ...(note.subtopics || [])]).every(note => isPartComplete(note, completedParts))).length;
    const complete = isMilestoneUnlocked(courseId, modules, completedParts, definition) && isMilestoneComplete(modules, completedParts, definition);
    const previousComplete = index === 0 || getMilestones(courseId).slice(0, index).every(previous => isMilestoneComplete(modules, completedParts, previous));
    return { definition, parts, doneParts, completedModules, complete, unlocked: !definition.locked && previousComplete };
  }), [courseId, modules, completedParts]);
  if (!milestones.length) return null;
  const current = milestones.find(item => !item.complete && item.unlocked) || milestones[milestones.length - 1];
  const remainingLessons = milestones.reduce((sum, item) => sum + Math.max(0, item.parts.length - item.doneParts), 0);
  const remainingProjects = milestones.filter(item => item.definition.kind === 'project' && !item.complete).length;
  const earned = milestones.filter(item => item.complete).length;
  const estimatedMinutes = Math.max(0, Math.round(remainingLessons * 8));
  return <section className="milestone-dashboard" aria-label="Milestone journey">
    <div className="milestone-dashboard-hero"><div><span className="milestone-dashboard-eyebrow">MILESTONE JOURNEY</span><h2>Build your proof of progress.</h2><p>Five verified achievements that turn lessons into a portfolio story.</p></div><div className="milestone-dashboard-ring"><strong>{progressPct}%</strong></div></div>
    <div className="milestone-dashboard-stats"><div><b>{current.definition.name}</b><span>Current milestone</span></div><div><b>{remainingLessons}</b><span>Lessons remaining</span></div><div><b>{remainingProjects}</b><span>Projects remaining</span></div><div><b>{estimatedMinutes} min</b><span>Estimated time</span></div><div><b>{earned}/5</b><span>Badges earned</span></div></div>
    <div className="milestone-timeline">{milestones.map((item, index) => <div key={item.definition.id} className={`milestone-timeline-item${item.complete ? ' is-complete' : item === current ? ' is-current' : item.definition.locked ? ' is-locked' : ''}`}><div className="milestone-timeline-node">{item.complete ? '✓' : item.definition.locked ? <span aria-label="Locked">⌑</span> : <MilestoneIcon index={index + 1} size={22} />}</div><div className="milestone-timeline-copy"><div><strong>{item.definition.name}</strong><span>{item.complete ? 'Badge earned' : item.definition.locked ? 'Locked' : item === current ? 'Next up' : `${item.doneParts}/${item.parts.length} lessons`}</span></div><p>{item.definition.skills.slice(0, 4).join(' · ')}</p></div></div>)}</div>
  </section>;
}
