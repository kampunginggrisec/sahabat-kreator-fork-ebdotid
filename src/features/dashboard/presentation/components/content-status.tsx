import { Badge } from "@/shared/presentation/components/ui/badge";

export function ContentStatus({
  status,
}: {
  status: "draft" | "published" | "scheduled";
}) {
  switch (status) {
    case "published":
      return (
        <Badge variant="success">
          Terbit
        </Badge>
      );
    case "scheduled":
      return (
        <Badge variant="warning">
          Dijadwalkan
        </Badge>
      );
    default:
      return (
        <Badge variant="default">
          Draf
        </Badge>
      );
  }
}
