"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";

/**
 * Action de Login (Chamada pelo formulário)
 */
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Email ou senha incorretos.";
        default:
          return "Algo deu errado. Tente novamente.";
      }
    }
    // Necessário relançar para o Next.js tratar o redirect
    throw error;
  }
}

/**
 * Action de Logout (Limpa cookies manualmente)
 */
export async function logout() {
  try {
    const cookieStore = await cookies();
    
    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction 
      ? "__Secure-authjs.session-token" 
      : "authjs.session-token";
      
    // Limpa o cookie compartilhado
    cookieStore.delete({
      name: cookieName,
      domain: isProduction ? ".gatocomics.com.br" : ".gatocomics.local",
      path: "/", 
    });

    await signOut({ redirectTo: "/login" });
    
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") {
        throw error;
    }
    console.error("Erro no logout:", error);
    throw error;
  }
}