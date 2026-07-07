import { ReactNode } from "react";

import { StatCard } from "@/shared/presentation/components/ui/stat-card";

import { MetricTrend } from "@/shared/presentation/components/ui/metric-trend";

type Props = {
  title: string;
  value: string;
  trend?: number;
  icon?: ReactNode;
  subtitle?: string;
};

export function MetricCard({
  title,
  value,
  trend,
  icon,
  subtitle,
}: Props) {
  return (
    <StatCard
      title={title}
      value={value}
      icon={icon}
      subtitle={subtitle}
      trend={
        trend !== undefined
          ? <MetricTrend value={trend}/>
          : undefined
      }
    />
  );
}