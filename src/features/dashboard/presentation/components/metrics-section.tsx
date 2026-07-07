import { Users, Eye, Heart, MessageCircle, Share2, FileText, TrendingUp } from "lucide-react";

import { StatsBlock } from "@/shared/presentation/components/blocks/stats-block";

import { MetricCard } from "./metric-card";

import type { DashboardSummary } from "@/features/dashboard/application/use-cases/get-dashboard-summary";

type Props = {
  summary: DashboardSummary;
};

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export function MetricsSection({ summary }: Props) {
  const { accounts, content, engagement } = summary;

  const topPlatform = accounts.byPlatform[0];
  const topContentPlatform = content.byPlatform[0];

  return (
    <StatsBlock
      title="Overview"
      description="Ringkasan performa workspace berdasarkan data Repliz."
      items={[
        {
          id: "accounts",
          content: (
            <MetricCard
              title="Akun Terhubung"
              value={accounts.total.toString()}
              subtitle={topPlatform ? `${topPlatform.platform}: ${topPlatform.count}` : "Belum ada akun"}
              icon={<Users size={22} />}
            />
          ),
        },
        {
          id: "content",
          content: (
            <MetricCard
              title="Total Konten"
              value={content.total.toString()}
              subtitle={topContentPlatform ? `${topContentPlatform.platform}: ${topContentPlatform.count}` : "Belum ada konten"}
              icon={<FileText size={22} />}
            />
          ),
        },
        {
          id: "views",
          content: (
            <MetricCard
              title="Avg. Views"
              value={formatNumber(engagement.views)}
              icon={<Eye size={22} />}
            />
          ),
        },
        {
          id: "engagement",
          content: (
            <MetricCard
              title="Engagement Rate"
              value={`${engagement.engagementRate}%`}
              icon={<TrendingUp size={22} />}
            />
          ),
        },
      ]}
      footerItems={[
        {
          id: "likes",
          content: (
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatNumber(engagement.likes)}</span>
              <span className="text-xs text-muted-foreground">likes</span>
            </div>
          ),
        },
        {
          id: "comments",
          content: (
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatNumber(engagement.comments)}</span>
              <span className="text-xs text-muted-foreground">comments</span>
            </div>
          ),
        },
        {
          id: "shares",
          content: (
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatNumber(engagement.shares)}</span>
              <span className="text-xs text-muted-foreground">shares</span>
            </div>
          ),
        },
      ]}
    />
  );
}