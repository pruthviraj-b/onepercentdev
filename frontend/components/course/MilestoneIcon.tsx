'use client';

export function MilestoneIcon({ index, size = 24 }: { index: number; size?: number }) {
  const stroke = index === 1 ? '#C27A32' : index === 2 ? '#64748B' : index === 3 ? '#D99A16' : index === 4 ? '#7C3AED' : '#B7791F';
  const fill = index === 1 ? '#FDE7C7' : index === 2 ? '#E5E7EB' : index === 3 ? '#FEF3C7' : index === 4 ? '#EDE9FE' : '#FEF3C7';
  return <span aria-hidden="true" style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, flex: `0 0 ${size}px`, color: stroke }}>
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
      {index <= 3 && <><path d="M8 5h16l-2 7H10L8 5Z" fill={fill} stroke={stroke} strokeWidth="1.7"/><path d="M11 12h10v5c0 4-2 7-5 9-3-2-5-5-5-9v-5Z" fill={fill} stroke={stroke} strokeWidth="1.7"/><path d="M13 21h6" stroke={stroke} strokeWidth="1.7" strokeLinecap="round"/><path d="M12 5 9 2M20 5l3-3" stroke={stroke} strokeWidth="1.7" strokeLinecap="round"/></>}
      {index === 4 && <><path d="M9 6h14v9c0 4-3 7-7 7s-7-3-7-7V6Z" fill={fill} stroke={stroke} strokeWidth="1.7"/><path d="M9 9H5v3c0 3 2 5 5 5M23 9h4v3c0 3-2 5-5 5M16 22v5M11 27h10" stroke={stroke} strokeWidth="1.7" strokeLinecap="round"/></>}
      {index === 5 && <><path d="M16 4 19 11l7 .6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7L6 11.6l7-.6 3-7Z" fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinejoin="round"/><path d="M16 9v6M13 12h6" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/></>}
    </svg>
  </span>;
}
