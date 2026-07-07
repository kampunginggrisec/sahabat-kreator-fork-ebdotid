import { PerformanceChart } from "./performance-chart";
import { EngagementChart } from "./engagement-chart";
import { TopPerformingChart } from "./top-performing-chart";
import { QuickActionsSection } from "./quick-actions-section";

import { ContentGrid } from "@/shared/presentation/components/ui/content-grid";
import { PageSection } from "@/shared/presentation/components/ui/page-section";
import { SectionHeader } from "@/shared/presentation/components/ui/section-header";

import type { DashboardSummary } from "@/features/dashboard/application/use-cases/get-dashboard-summary";

type Props = {
  summary: DashboardSummary;
};

export function PerformanceSection({ summary }: Props) {
  return (
    <PageSection>
      <SectionHeader
        title="Analytics & Performa"
        description="Analitik engagement dan distribusi konten dari Repliz."
      />

      <ContentGrid className="xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PerformanceChart summary={summary} />
        </div>

        <QuickActionsSection />
      </ContentGrid>

      {summary.engagementBreakdown.length > 0 && (
        <ContentGrid className="mt-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <EngagementChart summary={summary} />
          </div>
          <div>
            <TopPerformingChart summary={summary} />
          </div>
        </ContentGrid>
      )}
    </PageSection>
  );
}