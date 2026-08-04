import type { ReactNode } from 'react';
import { Card } from '../core/Card';
export function CourseCard({ title, meta, children }: { title: ReactNode; meta?: ReactNode; children?: ReactNode }) { return <Card><div className="ds-course-card__title">{title}</div>{meta && <div className="ds-course-card__meta">{meta}</div>}{children}</Card>; }
