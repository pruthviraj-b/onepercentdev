export const animations = {
  duration: { instant: '0ms', fast: '120ms', normal: '200ms', slow: '320ms', slower: '500ms' },
  easing: { standard: 'cubic-bezier(0.2, 0, 0, 1)', emphasized: 'cubic-bezier(0.2, 0, 0, 1)', decelerated: 'cubic-bezier(0, 0, 0.2, 1)' },
  names: { fade: 'ds-fade', rise: 'ds-rise', scale: 'ds-scale', shimmer: 'ds-shimmer', spin: 'ds-spin' },
} as const;
