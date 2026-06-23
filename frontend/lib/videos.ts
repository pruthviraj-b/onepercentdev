// YouTube video IDs — loaded from static JSON exported by export-data.js
// The source of truth is courses.config.json at the project root.

let videosCache: Record<string, Record<string, string>> | null = null;

const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/onepercentdev' : '';

async function loadVideos(): Promise<Record<string, Record<string, string>>> {
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

// Synchronous getter for use in components (uses cached data)
export function getVideoId(courseId: string, part: number): string | null {
  if (!videosCache) return null;
  const courseVideos = videosCache[courseId];
  if (!courseVideos) return null;
  return courseVideos[String(part)] ?? null;
}

// Async initializer — call once at app boot
export async function initVideos(): Promise<void> {
  await loadVideos();
}
