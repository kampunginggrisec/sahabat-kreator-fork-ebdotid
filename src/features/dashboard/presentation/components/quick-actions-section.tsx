import {
  Calendar,
  LineChart,
  PlusSquare,
} from "lucide-react";

import { ActionCard } from "@/shared/presentation/components/ui/action-card";

import { Stack } from "@/shared/presentation/components/ui/stack";

export function QuickActionsSection() {
  return (
    <Stack>
      <ActionCard
        title="Create Content"
        description="Mulai membuat konten baru."
        icon={<PlusSquare size={20} />}
      />

      <ActionCard
        title="Schedule Content"
        description="Jadwalkan posting berikutnya."
        icon={<Calendar size={20} />}
      />

      <ActionCard
        title="Analytics"
        description="Lihat performa seluruh platform."
        icon={<LineChart size={20} />}
      />
    </Stack>
  );
}