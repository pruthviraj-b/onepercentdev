import type { Module } from '@/services/courseService';

export type MilestoneKind = 'learning' | 'project';

export interface MilestoneDefinition {
  id: string;
  index: number;
  name: string;
  kind: MilestoneKind;
  moduleIds: number[];
  badgeName: string;
  skills: string[];
  nextLabel?: string;
  locked?: boolean;
}

const M = (id: string, index: number, name: string, kind: MilestoneKind, moduleIds: number[], badgeName: string, skills: string[], nextLabel?: string, locked = false): MilestoneDefinition => ({ id, index, name, kind, moduleIds, badgeName, skills, nextLabel, locked });

const CONFIG: Record<string, MilestoneDefinition[]> = {
  excel: [
    M('foundation', 1, 'Foundation', 'learning', [1, 2, 3, 4], 'Foundation Builder', ['Excel fundamentals', 'Data cleaning', 'Formatting', 'Core formulas'], 'Ready for Excel Professional'),
    M('professional', 2, 'Professional', 'learning', [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 'Professional Practitioner', ['Functions', 'PivotTables', 'Charts', 'Statistics', 'What-if analysis'], 'Ready for Excel Advanced'),
    M('advanced', 3, 'Advanced', 'learning', [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 41, 42, 43, 44, 45, 46, 47, 48, 49], 'Advanced Practitioner', ['Power Query', 'Data modeling', 'DAX', 'Dashboards', 'Automation'], 'Ready for the Applied Project'),
    M('project-1', 4, 'Applied Project', 'project', [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], 'Applied Project', ['Business datasets', 'Domain analysis', 'Dashboard storytelling'], 'Ready for the Master Project'),
    M('project-2', 5, 'Master Project', 'project', [50], 'Master Project', ['Portfolio documentation', 'End-to-end analysis', 'Professional delivery'], undefined, false),
  ],
  sql: [
    M('foundation', 1, 'Foundation', 'learning', [1, 2], 'Foundation Builder', ['SELECT', 'WHERE', 'Database basics', 'Table management'], 'Ready for SQL Professional'),
    M('professional', 2, 'Professional', 'learning', [3, 4, 5, 6], 'Professional Practitioner', ['Filtering', 'Subqueries', 'Data modification', 'Joins'], 'Ready for SQL Advanced'),
    M('advanced', 3, 'Advanced', 'learning', [7, 9, 10], 'Advanced Practitioner', ['CTEs', 'Window functions', 'Security concepts'], 'Ready for the Applied Project'),
    M('project-1', 4, 'Applied Project', 'project', [8], 'Applied Project', ['Real-world analyst tasks', 'Business questions', 'SQL investigation'], 'Master Project remains locked'),
    M('project-2', 5, 'Master Project', 'project', [], 'Master Project', ['Dedicated capstone', 'Professional documentation', 'Portfolio delivery'], undefined, true),
  ],
  'python': [
    M('foundation', 1, 'Foundation', 'learning', Array.from({ length: 14 }, (_, i) => i + 1), 'Foundation Builder', ['Python fundamentals', 'Collections', 'Control flow', 'Functions', 'Files'], 'Ready for Python Professional'),
    M('professional', 2, 'Professional', 'learning', Array.from({ length: 59 }, (_, i) => i + 15), 'Professional Practitioner', ['NumPy', 'Pandas', 'Cleaning', 'Transformations', 'Time series'], 'Ready for Python Advanced'),
    M('advanced', 3, 'Advanced', 'learning', [...Array.from({ length: 52 }, (_, i) => i + 74), ...Array.from({ length: 7 }, (_, i) => i + 134), 142], 'Advanced Practitioner', ['Visualization', 'Statistics', 'APIs', 'Business analytics', 'Interview readiness'], 'Ready for the Applied Project'),
    M('project-1', 4, 'Applied Project', 'project', Array.from({ length: 8 }, (_, i) => i + 126), 'Applied Project', ['Sales and HR analytics', 'Customer analysis', 'Business dashboards'], 'Ready for the Master Project'),
    M('project-2', 5, 'Master Project', 'project', [141], 'Master Project', ['Capstone delivery', 'Professional documentation', 'Portfolio-ready analysis'], undefined, false),
  ],
  'data-analyst-en': [
    M('foundation', 1, 'Foundation', 'learning', [1], 'Foundation Builder', ['Excel modeling', 'Data fundamentals'], 'Ready for the Professional milestone'),
    M('professional', 2, 'Professional', 'learning', [2, 3], 'Professional Practitioner', ['Statistics', 'Python/Pandas', 'SQL engineering'], 'Ready for the Advanced milestone'),
    M('advanced', 3, 'Advanced', 'learning', [4, 7], 'Advanced Practitioner', ['Relational data', 'Query design', 'Production thinking', 'Tutorial review'], 'Ready for the Applied Project'),
    M('project-1', 4, 'Applied Project', 'project', [5], 'Applied Project', ['Tableau', 'Power BI', 'Dashboard delivery'], 'Ready for the Master Project'),
    M('project-2', 5, 'Master Project', 'project', [6], 'Master Project', ['Capstone datasets', 'Professional documentation', 'Portfolio delivery'], undefined, false),
  ],
};

export function getMilestones(courseId: string): MilestoneDefinition[] { return CONFIG[courseId] || []; }
export function hasMilestoneSystem(courseId: string): boolean { return getMilestones(courseId).length === 5; }
export function milestoneForModule(courseId: string, moduleId: number): MilestoneDefinition | null { return getMilestones(courseId).find(item => item.moduleIds.includes(moduleId)) || null; }
export function milestoneParts(modules: Module[], milestone: MilestoneDefinition): number[] {
  return modules.filter(module => milestone.moduleIds.includes(module.id)).flatMap(module => module.notes.flatMap(note => [note.part, ...(note.subtopics || []).map(subtopic => subtopic.part)]));
}

export function isMilestoneComplete(modules: Module[], completedParts: number[], milestone: MilestoneDefinition): boolean {
  if (milestone.locked) return false;
  const parts = milestoneParts(modules, milestone);
  return parts.length > 0 && parts.every(part => completedParts.includes(part));
}

export function isMilestoneUnlocked(courseId: string, modules: Module[], completedParts: number[], milestone: MilestoneDefinition): boolean {
  if (milestone.locked) return false;
  const milestones = getMilestones(courseId);
  const index = milestones.findIndex(item => item.id === milestone.id);
  if (index < 0) return false;
  return milestones.slice(0, index).every(previous => isMilestoneComplete(modules, completedParts, previous));
}
