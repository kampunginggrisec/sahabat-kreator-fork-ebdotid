import {
  Grid3x3,
  Share2,
  BarChart3,
  Sparkles,
  Paintbrush,
  CalendarCheck,
  BookOpen,
  RefreshCcw,
  CalendarRange,
  MessageSquare,
  Inbox,
  Library,
  Hash,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string; // relatif terhadap /[orgSlug]/[workspaceSlug]
  icon: LucideIcon;
  description?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Ringkasan",
    items: [
      {
        label: "Dashboard",
        href: "",
        icon: Grid3x3,
        description: "Pusat performa akun Anda",
      },
    ],
  },
  {
    label: "Konten",
    items: [
      {
        label: "Generate Konten",
        href: "/content/generate",
        icon: Sparkles,
        description: "Buat konten baru dengan AI",
      },
      {
        label: "Content Plan",
        href: "/content-plan",
        icon: CalendarRange,
        description: "Jadwalkan & kelola rencana",
      },
      {
        label: "Content Transform",
        href: "/content/transform",
        icon: RefreshCcw,
        description: "Ubah format konten",
      },
      {
        label: "Template Slide",
        href: "/slide-templates",
        icon: Paintbrush,
        description: "Desain template untuk carousel AI",
      },
      {
        label: "Daftar Konten",
        href: "/content",
        icon: Library,
        description: "Lihat konten yang sudah dipublikasikan",
      },
      { label: "Hashtag",
        href: "/hashtag-research",
        icon: Hash, 
        description: "Cari memori dan analisis hashtag", 
      }
    ],
  },
  {
    label: "Interaksi",
    items: [
      {
        label: "Inbox",
        href: "/inbox",
        icon: Inbox,
        description: "Balas pesan dari semua akun",
      },
      {
        label: "Komentar",
        href: "/comments",
        icon: MessageSquare,
        description: "Moderasi komentar akun terhubung",
      },
    ],
  },
  {
    label: "Optimasi",
    items: [
      {
        label: "Momentum",
        href: "/momentum",
        icon: CalendarCheck,
        description: "Waktu terbaik posting",
      },
      {
        label: "Analitik",
        href: "/analytics",
        icon: BarChart3,
        description: "Insight performa",
      },
    ],
  },
  {
    label: "Akun & Pengetahuan",
    items: [
      {
        label: "Integrasi Sosial",
        href: "/social-integration",
        icon: Share2,
        description: "Kelola akun terhubung",
      },
      {
        label: "Knowledge Base",
        href: "/knowledge",
        icon: BookOpen,
        description: "Aturan & materi referensi",
      },
      {
        label: "Kelola Anggota",
        href: "/members",
        icon: Users,
        description: "Undang & kelola akses workspace tim",
      },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      {
        label: "Workspace",
        href: "/settings/workspace",
        icon: Settings,
        description: "Pengaturan workspace",
      },
      {
        label: "Organisasi",
        href: "/settings/organization",
        icon: Settings,
        description: "Pengaturan organisasi",
      },
      {
        label: "Advanced",
        href: "/settings/advanced",
        icon: Settings,
        description: "Pengaturan lanjutan",
      },
    ],
  },
];

// Backwards-compatible flat list (dipakai sidebar-mobile-trigger atau tempat lain).
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);