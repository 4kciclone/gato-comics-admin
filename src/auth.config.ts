import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login", // Define a página de login oficial
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      // 1. Sempre permitir rotas de API de autenticação (para o login funcionar)
      if (isApiAuth) return true;

      // 2. Lógica da Página de Login
      if (isOnLogin) {
        // Se o usuário já está logado e tenta entrar no login, manda pro dashboard
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        // Se não está logado, PERMITE ficar na página de login (Quebra o loop)
        return true; 
      }

      // 3. Para todas as outras páginas (Dashboard, Obras, etc)
      if (!isLoggedIn) {
        return false; // Redireciona para /login automaticamente
      }

      // 4. Verificação de Cargo (Opcional aqui, pois o Layout já protege)
      // Mas é bom ter uma camada extra
      const role = auth?.user?.role;
      if (role === "USER") {
        // Se for usuário comum tentando acessar admin, bloqueia
        return false; 
      }

      return true; // Permite acesso
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