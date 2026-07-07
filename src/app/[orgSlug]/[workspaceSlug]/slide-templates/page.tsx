"use client";

import { useState, useEffect, useCallback } from "react";
import { TemplateEditorForm } from "@/features/slide-template/presentation/components/template-editor-form";
import { TemplateList } from "@/features/slide-template/presentation/components/template-list";
import { listSlideTemplatesAction } from "@/features/slide-template/application/use-cases/list-slide-templates";

export default function Page() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => setTemplates(await listSlideTemplatesAction()), []);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Template Slide</h1>
          <p className="text-sm text-muted-foreground">Desain visual untuk carousel yang di-generate AI.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background">
          {showForm ? "Tutup" : "+ Buat Template"}
        </button>
      </div>

      {showForm && <TemplateEditorForm onSaved={() => { setShowForm(false); refresh(); }} />}
      <TemplateList templates={templates} onChanged={refresh} />
    </div>
  );
}
