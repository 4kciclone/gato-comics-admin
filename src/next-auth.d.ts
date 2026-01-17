import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  // Estende a Sessão para incluir o role
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  // Estende o Usuário para incluir o role
  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  // Estende o Token JWT para incluir o role
  interface JWT {
    role: UserRole;
  }
}