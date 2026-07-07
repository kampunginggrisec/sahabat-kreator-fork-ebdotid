import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, admin } from "better-auth/plugins";
import { db } from "@/shared/infrastructure/database/client";
import * as schema from "@/shared/infrastructure/database/schema";
import { team as teamTable } from "@/shared/infrastructure/database/schema/auth-schema";
import { workspaceMemberRole } from "@/shared/infrastructure/database/schema/workspace-schema";
import { eq } from "drizzle-orm";
import { nextCookies } from "better-auth/next-js";
import { autoCreateOrganizationAndWorkspace } from "@/features/organization/application/use-cases/auto-create-organization";
import { nanoid } from "nanoid";
import { openAPI } from "better-auth/plugins"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema, // wajib eksplisit
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300, // cache TTL 5 menit
      updateAge: 60, // refresh cookie saat tersisa < 1 menit
      strategy: "compact", // Base64 + HMAC signature (fast, no JWT overhead)
    },
  },

  plugins: [
    organization({
      teams: {
        enabled: true,
        maximumTeams: 20,
      },
      defaultTeam: {
        enabled: false,
      },
      schema: {
        team: {
          additionalFields: {
            slug: {
              type: "string",
              required: true,
              unique: true,
            },
          },
        },
      },
    }),
    admin(),
    nextCookies(), // WAJIB paling akhir di array plugins (Next.js cookie handling)
    openAPI(), 
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await autoCreateOrganizationAndWorkspace(user);
        },
      },
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;