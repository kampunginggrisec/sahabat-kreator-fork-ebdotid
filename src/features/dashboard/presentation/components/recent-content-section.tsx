import { ContentGrid } from "@/shared/presentation/components/ui/content-grid";
import { PageSection } from "@/shared/presentation/components/ui/page-section";
import { SectionHeader } from "@/shared/presentation/components/ui/section-header";

import { Badge } from "@/shared/presentation/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Eye, Heart, MessageCircle, Share2 } from "lucide-react";

import type { DashboardSummary } from "@/features/dashboard/application/use-cases/get-dashboard-summary";

type Props = {
  summary: DashboardSummary;
};

export function RecentContentSection({ summary }: Props) {
  const recentContent = summary.recentContent;
  const topPerforming = summary.topPerforming;

  const topFive = topPerforming.slice(0, 5).map((tp) => {
    const rc = recentContent.find((c) => c.id === tp.id);
    return {
      ...tp,
      thumbnail: rc?.thumbnail,
      url: rc?.url,
      createdAt: rc?.createdAt,
      type: rc?.type,
      accountId: rc?.accountId,
    };
  });

  return (
    <PageSection>
      <SectionHeader title="Konten Performa Terbaik" />

      {topPerforming.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed bg-muted/30 py-12 text-sm text-muted-foreground">
          Belum ada konten yang terhubung dari akun Repliz.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Konten</th>
                  <th className="px-4 py-3 text-left font-medium">Views</th>
                  <th className="px-4 py-3 text-left font-medium">Likes</th>
                  <th className="px-4 py-3 text-left font-medium">Comments</th>
                  <th className="px-4 py-3 text-left font-medium">Shares</th>
                  <th className="px-4 py-3 text-left font-medium">Score</th>
                  <th className="px-4 py-3 text-right font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topFive.map((content, idx) => {
                  const score =
                    (content.views ?? 0) +
                    (content.likes ?? 0) * 2 +
                    (content.comments ?? 0) * 5;
                  const relTime = (() => {
                    if (!content.createdAt) return "-";
                    try {
                      return formatDistanceToNow(new Date(content.createdAt), { addSuffix: true });
                    } catch {
                      return String(content.createdAt).slice(0, 10);
                    }
                  })();

                  return (
                    <tr key={content.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {content.thumbnail && (
                            <img
                              src={content.thumbnail}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-md object-cover bg-muted"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium max-w-xs">{content.title}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <Badge variant="outline" className="h-4 px-1 text-[10px] uppercase">
                                {content.platform}
                              </Badge>
                              {content.type && (
                                <span className="text-[10px] text-muted-foreground">{content.type}</span>
                              )}
                              {content.url && (
                                <a
                                  href={content.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary hover:underline"
                                >
                                  Buka &rarr;
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye size={14} className="text-muted-foreground/50" />
                          {content.views?.toLocaleString() ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Heart size={14} className="text-muted-foreground/50" />
                          {content.likes?.toLocaleString() ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageCircle size={14} className="text-muted-foreground/50" />
                          {content.comments?.toLocaleString() ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Share2 size={14} className="text-muted-foreground/50" />
                          -
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{score.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap text-muted-foreground">
                        {relTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageSection>
  );
}