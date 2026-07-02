// YouTube video IDs — loaded from static JSON exported by export-data.js
// The source of truth is courses.config.json at the project root.
// Each part can have a single video ID (string) or multiple (string[]).

let videosCache: Record<string, Record<string, string | string[]>> | null = null;

const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/onepercentdev' : '';

async function loadVideos(): Promise<Record<string, Record<string, string | string[]>>> {
  if (videosCache) return videosCache;
  try {
    const res = await fetch(`${BASE_PATH}/api/videos.json`);
    if (res.ok) {
      videosCache = await res.json();
      return videosCache!;
    }
  } catch (err) {
    console.warn('Failed to load videos.json, falling back to empty:', err);
  }
  videosCache = {};
  return videosCache;
}

// Returns the first video ID (backward compat)
export function getVideoId(courseId: string, part: number): string | null {
  const ids = getVideoIds(courseId, part);
  return ids.length > 0 ? ids[0] : null;
}

// Returns all video IDs for a part (new multi-video API)
export function getVideoIds(courseId: string, part: number): string[] {
  if (!videosCache) return [];
  const courseVideos = videosCache[courseId];
  if (!courseVideos) return [];
  const val = courseVideos[String(part)];
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string' && val.trim()) return [val.trim()];
  return [];
}

// Async initializer — call once at app boot
export async function initVideos(): Promise<void> {
  await loadVideos();
}
