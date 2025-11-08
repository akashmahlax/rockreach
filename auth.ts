import NextAuth, { type NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import client, { getDb } from "@/lib/db"

const authConfig: NextAuthConfig = {
  providers: [Google],
  adapter: MongoDBAdapter(client),
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        const email = user.email ?? session.user.email ?? undefined;

        if (email) {
          const db = await getDb();
          const dbUser = await db.collection("users").findOne({ email });

          const resolvedOrgId = dbUser?.orgId ? String(dbUser.orgId) : session.user.email ?? undefined;

          session.user.role = (dbUser?.role as string | undefined) ?? session.user.role ?? "user";
          session.user.orgId = resolvedOrgId;
        } else {
          session.user.role = session.user.role ?? "user";
        }

        if (user.id) {
          session.user.id = user.id;
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)