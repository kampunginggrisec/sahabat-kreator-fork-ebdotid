"use client";

import { setDefaultTemplateAction } from "../../application/use-cases/set-default-template";
import { deleteSlideTemplateAction } from "../../application/use-cases/delete-slide-template";
import type { SlideTemplateData } from "../../domain/entities/slide-template.entity";

export function TemplateList({ templates, onChanged }: { templates: SlideTemplateData[]; onChanged: () => void }) {
  async function handleSetDefault(id: string) {
    await setDefaultTemplateAction(id);
    onChanged();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus template "${name}"?`)) return;
    await deleteSlideTemplateAction(id);
    onChanged();
  }

  if (templates.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada template. Carousel akan pakai style default bawaan sistem.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <div key={t.id} className="space-y-2 rounded-lg border p-3">
          <div className="aspect-[4/5] rounded-md" style={{ backgroundColor: t.backgroundColor, backgroundImage: t.backgroundImageUrl ? `url(${t.backgroundImageUrl})` : undefined, backgroundSize: "cover" }} />
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t.name}{t.isDefault && " ⭐"}</p>
            <button onClick={() => handleDelete(t.id, t.name)} className="text-xs text-muted-foreground hover:text-destructive">Hapus</button>
          </div>
          {!t.isDefault && <button onClick={() => handleSetDefault(t.id)} className="text-xs text-blue-600 hover:underline">Jadikan default</button>}
        </div>
      ))}
    </div>
  );
}
