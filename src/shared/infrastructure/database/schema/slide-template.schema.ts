import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { team } from "./auth-schema";

export const slideTemplate = pgTable("slide_template", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => team.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  backgroundColor: text("background_color").notNull().default("#18181B"),
  backgroundImageUrl: text("background_image_url"),
  textColor: text("text_color").notNull().default("#FAFAFA"),
  fontFamily: text("font_family").notNull().default("sans-serif"),
  logoUrl: text("logo_url"),
  logoPosition: text("logo_position").notNull().default("top-left"),

  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
