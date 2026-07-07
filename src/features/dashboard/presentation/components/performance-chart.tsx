"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

import { ChartCard } from "@/shared/presentation/components/ui/chart-card";

import type { DashboardSummary } from "@/features/dashboard/application/use-cases/get-dashboard-summary";

type Props = {
  summary: DashboardSummary;
};

// Brand-inspired palette for platforms
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E4405F",
  Facebook: "#1877F2",
  YouTube: "#FF0000",
  TikTok: "#000000",
  Threads: "#000000",
  LinkedIn: "#0A66C2",
  X: "#0F1419",
  Shopee: "#EE4D2D",
  Twitter: "#1DA1F2",
};

const FALLBACK_PALETTE = [
  "hsl(var(--primary))",
  "#E4405F",
  "#1877F2",
  "#FF0000",
  "#0A66C2",
  "#25D366",
  "#F59E0B",
  "#8B5CF6",
];

export function PerformanceChart({ summary }: Props) {
  const data = summary.content.byPlatform;

  const coloredData = data.map((d, idx) => ({
    ...d,
    color: PLATFORM_COLORS[d.platform] ?? FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Distribusi Konten per Platform"
      description="Jumlah konten yang dipublikasikan, dikelompokkan per akun yang terhubung."
    >
      {coloredData.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
          Belum ada konten dari akun terhubung.
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coloredData} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="platform"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="count"
                name="Konten"
                radius={[6, 6, 0, 0]}
              >
                {coloredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}