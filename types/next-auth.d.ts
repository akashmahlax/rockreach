import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      role?: string;
      orgId?: string;
    };
  }

  interface User {
    role?: string;
    orgId?: string;
  }
}

export {};
