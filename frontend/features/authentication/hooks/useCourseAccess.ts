export function useCourseAccess(_courseId?: string) { return { hasAccess: false, accessType: 'unknown' as const, loading: false }; }
