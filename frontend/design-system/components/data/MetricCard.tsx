import type { ReactNode } from 'react';
import { Card } from '../core/Card';
export function MetricCard({ label, value, detail }: { label: ReactNode; value: ReactNode; detail?: ReactNode }) { return <Card><div className="ds-metric__label">{label}</div><div className="ds-metric__value">{value}</div>{detail && <div className="ds-metric__detail">{detail}</div>}</Card>; }
