import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login", // Página de login do admin
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      // Se estiver na tela de login, deixa passar
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // Se não estiver logado, bloqueia tudo
      if (!isLoggedIn) return false;

      // Se logado, mas é usuário comum (leitor), BLOQUEIA
      if (role !== "ADMIN" && role !== "OWNER" && role !== "MODERATOR") {
        return false; // Manda pro login (ou poderia mandar pra uma página de erro 403)
      }

      return true; // É Staff, pode entrar
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