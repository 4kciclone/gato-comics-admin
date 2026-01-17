import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;
        
        try {
          const user = await prisma.user.findUnique({ 
            where: { email },
            // Seleciona os campos necessários
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              image: true,
            }
          });
          
          if (!user || !user.password) {
            return null;
          }

          // VERIFICAÇÃO EXTRA: Bloqueia usuários comuns no Painel Admin
          if (user.role === 'USER') {
            return null;
          }
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          
          if (!passwordsMatch) {
            return null;
          }
          
          // Retornar usuário sem a senha
          const { password: _, ...userWithoutPassword } = user;
          return userWithoutPassword;
          
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return null;
        }
      },
    }),
  ],
  // --- CONFIGURAÇÃO DE COOKIES COMPARTILHADOS ---
  // Isso resolve o problema de logout e loop de redirecionamento
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-authjs.session-token` 
        : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // O ponto no início (.) permite compartilhar entre subdomínios
        domain: process.env.NODE_ENV === "production"
          ? ".gatocomics.com.br"
          : ".gatocomics.local", 
      },
    },
  },
});