import { cookies } from "next/headers";
import { signOut } from "@/auth";

export async function logout() {
  const cookieStore = await cookies();
  
  // Deleta o cookie específico do admin
  cookieStore.delete("gato-admin-token");

  await signOut({ redirectTo: "/login" });
}