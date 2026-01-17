import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona imediatamente para o painel
  redirect("/dashboard");
}