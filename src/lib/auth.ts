import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) throw new Error("EMAIL_NOT_FOUND");
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) throw new Error("INVALID_PASSWORD");
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      await logAudit({
        actorId: String(user.id),
        action: "LOGIN",
        entity: "AUTH",
      });
    },
    async signOut({ token }) {
      if (!token?.id) return;
      await logAudit({
        actorId: String(token.id),
        action: "LOGOUT",
        entity: "AUTH",
      });
    },
  },
};
