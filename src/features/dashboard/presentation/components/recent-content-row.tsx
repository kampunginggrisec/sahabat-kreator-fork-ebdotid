import { MoreHorizontal, PlayCircle, Camera, Eye, Heart } from "lucide-react";
import { ContentStatus } from "./content-status";

interface RecentContentRowProps {
  title: string;
  platform: string;
  platformIcon: "play_circle" | "photo_camera";
  status: "draft" | "published" | "scheduled";
  date: string;
  views: string;
  likes: string;
}

export function RecentContentRow({
  title,
  platform,
  platformIcon,
  status,
  date,
  views,
  likes,
}: RecentContentRowProps) {
  const PlatformIcon = platformIcon === "play_circle" ? PlayCircle : Camera;

  return (
    <tr className="hover:bg-accent/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
            <PlatformIcon size={24} className="text-muted-foreground"/>
          </div>
          <p className="text-sm font-bold text-card-foreground">
            {title}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <PlatformIcon size={20} className="text-secondary"/>
          <span className="text-sm text-card-foreground">
            {platform}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <ContentStatus status={status} />
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {date}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          {views !== "Processing" ? (
            <>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Eye size={16} />
                {views}
              </div>
              {likes && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Heart size={16} />
                  {likes}
                </div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground italic text-xs">
              {views}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-2 hover:bg-accent rounded-lg">
          <MoreHorizontal size={20} />
        </button>
      </td>
    </tr>
  );
}
