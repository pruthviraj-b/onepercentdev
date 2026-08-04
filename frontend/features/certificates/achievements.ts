export interface AchievementRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  moduleId: number;
  moduleTitle: string;
  completedParts: number[];
  rangeLabel: string;
  completedAt: string;
  badgeDataUrl: string;
}

const STORAGE_PREFIX = 'opd_achievements_';

function storageKey(userId?: string | null) {
  return `${STORAGE_PREFIX}${userId || 'local'}`;
}

export function loadAchievements(userId?: string | null): AchievementRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAchievement(record: AchievementRecord, userId?: string | null): AchievementRecord[] {
  const next = [record, ...loadAchievements(userId).filter(item => item.id !== record.id)];
  try { window.localStorage.setItem(storageKey(userId), JSON.stringify(next)); } catch {}
  return next;
}

export function achievementId(courseId: string, moduleId: number) {
  return `${courseId}:module:${moduleId}:v4`;
}

export function makeBadgeDataUrl(courseTitle: string, partLabel: string, rangeLabel: string, completionLabel = '') {
  const safe = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] || char));
  const title = safe(courseTitle.slice(0, 34));
  const part = safe(partLabel.slice(0, 38));
  const range = safe(rangeLabel.slice(0, 38));
  const completion = safe(completionLabel.slice(0, 28));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <rect width="1200" height="1200" fill="#FFFFFF"/>
    <circle cx="600" cy="505" r="430" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="14"/>
    <circle cx="600" cy="505" r="382" fill="none" stroke="#F98012" stroke-width="3" stroke-dasharray="5 18"/>
    <circle cx="600" cy="505" r="300" fill="#FFFFFF" stroke="#22C55E" stroke-width="8"/>
    <path d="M600 278L670 320V410c0 78-52 126-70 136-18-10-70-58-70-136v-90z" fill="#FFF7ED" stroke="#F98012" stroke-width="5"/>
    <path d="M568 389l22 22 45-52" fill="none" stroke="#22C55E" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="600" y="205" text-anchor="middle" fill="#F98012" font-family="Google Sans Flex, sans-serif" font-size="28" font-weight="700" letter-spacing="7">1% DEV ACADEMY</text>
    <text x="600" y="760" text-anchor="middle" fill="#1F2937" font-family="Google Sans Flex, sans-serif" font-size="48" font-weight="700">${part}</text>
    <text x="600" y="815" text-anchor="middle" fill="#22C55E" font-family="Google Sans Flex, sans-serif" font-size="36" font-weight="700">${title}</text>
    <text x="600" y="880" text-anchor="middle" fill="#6B7280" font-family="Google Sans Flex, sans-serif" font-size="24">MILESTONE BADGE</text>
    <path d="M390 968H810" stroke="#E5E7EB" stroke-width="3"/>
    <text x="600" y="1025" text-anchor="middle" fill="#6B7280" font-family="Google Sans Flex, sans-serif" font-size="23">${range}</text>
    <text x="600" y="1070" text-anchor="middle" fill="#F98012" font-family="Google Sans Flex, sans-serif" font-size="22">${completion}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function buildAchievementPost({
  courseTitle,
  partLabel,
  rangeLabel,
  completionLabel,
  learnedItems,
  reaction,
  customMessage,
}: {
  courseTitle: string;
  partLabel: string;
  rangeLabel: string;
  completionLabel: string;
  learnedItems: string[];
  reaction: string;
  customMessage?: string;
}) {
  const message = customMessage?.trim();
  return [
    `${reaction} Milestone Achieved: ${partLabel} – ${courseTitle}`,
    `Completed modules ${rangeLabel} (${completionLabel})`,
    learnedItems.length ? `What I learned:\n${learnedItems.map(item => `• ${item}`).join('\n')}` : '',
    'via 1% Dev Academy',
    '#SQL #DataAnalytics #LearningJourney',
    message ? `\n${message}` : '',
  ].filter(Boolean).join('\n');
}
