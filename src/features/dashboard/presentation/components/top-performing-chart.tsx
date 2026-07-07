"use client";

import { BarChart as RcBarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { ChartCard } from "@/shared/presentation/components/ui/chart-card";

import type { DashboardSummary } from "@/features/dashboard/application/use-cases/get-dashboard-summary";

type Props = {
  summary: DashboardSummary;
};

type Row = { title: string; score: number };

const PALETTE = [
  "#7C3AED", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F59E0B", // amber
  "#10B981", // emerald
];

export function TopPerformingChart({ summary }: Props) {
  const { topPerforming } = summary;

  const data: Row[] = topPerforming
    .slice(0, 5)
    .map((c) => {
      const score = (c.views ?? 0) + ((c.likes ?? 0) * 2) + ((c.comments ?? 0) * 5);
      return { title: (c.title || "Tanpa judul").slice(0, 30), score };
    })
    .sort((a, b) => b.score - a.score);

  if (data.length === 0) {
    return (
      <ChartCard title="Konten Terbaik" description="Top 5 konten berdasarkan engagement score dari Repliz.">
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
          Belum ada data performa.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Konten Terbaik" description="Top 5 berdasarkan engagement score (views + likes×2 + comments×5).">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RcBarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [`Score: ${value}`, "Engagement Score"]}
            />
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Bar>
          </RcBarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}