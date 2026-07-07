"use client";

import { useState } from "react";
import { Input } from "@/shared/presentation/components/ui/input";
import { Label } from "@/shared/presentation/components/ui/label";
import { Button } from "@/shared/presentation/components/ui/button";
import { MediaUploader } from "@/features/media-upload/presentation/components/media-uploader";
import { createSlideTemplateAction } from "../../application/use-cases/create-slide-template";
import type { LogoPosition } from "../../domain/entities/slide-template.entity";

const LOGO_POSITIONS: LogoPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

export function TemplateEditorForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#18181B");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [textColor, setTextColor] = useState("#FAFAFA");
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("top-left");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    await createSlideTemplateAction({ name, backgroundColor, backgroundImageUrl, textColor, fontFamily, logoUrl, logoPosition });
    setIsSaving(false);
    onSaved();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Template</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Template Gelap Utama" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bgColor">Warna Background</Label>
            <input id="bgColor" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-10 w-full rounded-md border" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="textColor">Warna Teks</Label>
            <input id="textColor" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-10 w-full rounded-md border" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Gambar Background (opsional, menimpa warna)</Label>
          {backgroundImageUrl ? (
            <div className="flex items-center justify-between rounded-md border p-2 text-xs">
              <span>Gambar terupload</span>
              <button onClick={() => setBackgroundImageUrl("")} className="text-destructive">Hapus</button>
            </div>
          ) : (
            <MediaUploader onUploaded={(m) => setBackgroundImageUrl(m.url)} />
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Logo (opsional)</Label>
          {logoUrl ? (
            <div className="flex items-center justify-between rounded-md border p-2 text-xs">
              <span>Logo terupload</span>
              <button onClick={() => setLogoUrl("")} className="text-destructive">Hapus</button>
            </div>
          ) : (
            <MediaUploader onUploaded={(m) => setLogoUrl(m.url)} />
          )}
        </div>

        {logoUrl && (
          <div className="space-y-1.5">
            <Label htmlFor="logoPos">Posisi Logo</Label>
            <select id="logoPos" value={logoPosition} onChange={(e) => setLogoPosition(e.target.value as LogoPosition)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {LOGO_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="font">Font</Label>
          <select id="font" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
          <p className="text-xs text-muted-foreground">Font custom (di luar 3 ini) butuh dukungan tambahan.</p>
        </div>

        <Button type="button" isLoading={isSaving} onClick={handleSave} disabled={name.trim().length < 2}>
          Simpan Template
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Preview (perkiraan — hasil render asli bisa sedikit beda)</p>
        <div
          className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-lg border"
          style={{ backgroundColor, backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined, backgroundSize: "cover", fontFamily }}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt="logo"
              className="absolute size-10 object-contain"
              style={{
                top: logoPosition.startsWith("top") ? 16 : undefined,
                bottom: logoPosition.startsWith("bottom") ? 16 : undefined,
                left: logoPosition.endsWith("left") ? 16 : undefined,
                right: logoPosition.endsWith("right") ? 16 : undefined,
              }}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center font-bold" style={{ color: textColor }}>
            Contoh teks slide di sini
          </div>
        </div>
      </div>
    </div>
  );
}
