export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type SlideTemplateData = {
  id: string;
  name: string;
  backgroundColor: string;
  backgroundImageUrl: string | null;
  textColor: string;
  fontFamily: string;
  logoUrl: string | null;
  logoPosition: LogoPosition;
  isDefault: boolean;
};
