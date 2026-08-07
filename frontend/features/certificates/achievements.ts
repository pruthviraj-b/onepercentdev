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
  return `${courseId}:module:${moduleId}:v5`;
}

export function makeBadgeDataUrl(courseTitle: string, partLabel: string, rangeLabel: string, completionLabel = '', credentialId = '', issuedAt = new Date().toISOString()) {
  const safe = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] || char));
  const title = safe(courseTitle.slice(0, 42));
  const part = safe(partLabel.slice(0, 42));
  const range = safe(rangeLabel.slice(0, 42));
  const completion = safe(completionLabel.slice(0, 34));
  const id = safe(credentialId || `OPD-${part.replace(/[^A-Z0-9]+/gi, '-').toUpperCase()}`);
  const date = safe(new Date(issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#243447"/></linearGradient></defs>
    <rect width="1200" height="1200" rx="44" fill="url(#bg)"/>
    <rect x="36" y="36" width="1128" height="1128" rx="28" fill="none" stroke="#F98012" stroke-width="4"/>
    <path d="M110 190H1090M110 1010H1090" stroke="#6EE7D2" stroke-width="2" opacity=".6"/>
    <text x="110" y="130" fill="#6EE7D2" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="6">ONE PERCENT DEVELOPER ACADEMY</text>
    <text x="1090" y="130" text-anchor="end" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="22" font-weight="700">VERIFIED RECORD</text>
    <circle cx="600" cy="430" r="248" fill="#F9FAFB" stroke="#F98012" stroke-width="10"/>
    <circle cx="600" cy="430" r="218" fill="none" stroke="#22C55E" stroke-width="3" stroke-dasharray="4 14"/>
    <path d="M600 245L684 296V399c0 92-60 150-84 165-24-15-84-73-84-165V296z" fill="#FFF7ED" stroke="#F98012" stroke-width="7"/>
    <path d="M560 382l30 30 62-72" fill="none" stroke="#16A34A" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="600" y="710" text-anchor="middle" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="5">MODULE MILESTONE</text>
    <text x="600" y="772" text-anchor="middle" fill="#6EE7D2" font-family="Arial, sans-serif" font-size="48" font-weight="700">${part}</text>
    <text x="600" y="832" text-anchor="middle" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="32" font-weight="700">${title}</text>
    <text x="600" y="882" text-anchor="middle" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="24">${range}  ·  ${completion}</text>
    <text x="110" y="1060" fill="#94A3B8" font-family="Arial, sans-serif" font-size="20" letter-spacing="2">CREDENTIAL ID</text>
    <text x="110" y="1098" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="24" font-weight="700">${id}</text>
    <text x="1090" y="1060" text-anchor="end" fill="#94A3B8" font-family="Arial, sans-serif" font-size="20" letter-spacing="2">ISSUED</text>
    <text x="1090" y="1098" text-anchor="end" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="24" font-weight="700">${date}</text>
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
