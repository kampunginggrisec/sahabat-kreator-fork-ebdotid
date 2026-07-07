"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

import { ChartCard } from "@/shared/presentation/components/ui/chart-card";

import type { DashboardSummary } from "@/features/dashboard/application/use-cases/get-dashboard-summary";

// More vibrant, distinct palette for stacked engagement metrics
const COLORS = {
  views: "#7C3AED",     // violet
  likes: "#EC4899",     // pink
  comments: "#06B6D4",  // cyan
  shares: "#F59E0B",    // amber
};

type Props = {
  summary: DashboardSummary;
};

export function EngagementChart({ summary }: Props) {
  const data = summary.engagementBreakdown;

  if (data.length === 0) {
    return (
      <ChartCard title="Breakdown Engagement per Platform" description="Rata-rata interaksi per konten berdasarkan data dari Repliz.">
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
          Belum cukup data engagement.
        </div>
      </ChartCard>
    );
  }

  const chartData = data.map((item) => ({
    platform: item.platform,
    views: item.views,
    likes: item.likes,
    comments: item.comments,
    shares: item.shares,
  }));

  return (
    <ChartCard
      title="Engagement per Platform"
      description="Rata-rata views, likes, comments, dan shares per konten yang terhubung."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="platform" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
            />
            <Bar dataKey="views" name="Views" fill={COLORS.views} radius={[4, 4, 0, 0]} stackId="eng" />
            <Bar dataKey="likes" name="Likes" fill={COLORS.likes} radius={[4, 4, 0, 0]} stackId="eng" />
            <Bar dataKey="comments" name="Comments" fill={COLORS.comments} radius={[4, 4, 0, 0]} stackId="eng" />
            <Bar dataKey="shares" name="Shares" fill={COLORS.shares} radius={[4, 4, 0, 0]} stackId="eng" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}