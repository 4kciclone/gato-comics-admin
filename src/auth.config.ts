import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // --- ADICIONE ISSO AQUI PARA O MIDDLEWARE LER O COOKIE CERTO ---
  cookies: {
    sessionToken: {
      name: `gato-admin-token`, // O mesmo nome que definimos no auth.ts
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // Sempre true em produção (HTTPS)
      },
    },
  },
  // -------------------------------------------------------------
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuth) return true;

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      // Verificação de cargo
      const role = auth?.user?.role;
      if (role === "USER") return false;

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;