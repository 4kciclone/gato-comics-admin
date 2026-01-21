import { auth, signOut } from "@/auth"; 
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, 
  Wallet, 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Paintbrush, 
  FileText, 
  Crown,
  Ticket
} from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  // 1. Bloqueio de Login
  if (!session || !session.user) {
    redirect("/login");
  }

  const { role, name } = session.user;

  // 2. Bloqueio de Usuário Comum (Leitor não entra aqui)
  if (role === "USER") {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Acesso Negado</h1>
          <p className="text-zinc-400">Esta área é restrita para funcionários.</p>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="text-sm underline hover:text-white">Sair desta conta</button>
          </form>
        </div>
      </div>
    );
  }

  // --- REGRAS DE VISIBILIDADE ---
  
  const showModeration = ["OWNER", "MODERATOR", "ADMIN"].includes(role);
  const showFinance = ["OWNER", "ACCOUNTANT"].includes(role);
  const showCosmetics = ["OWNER", "ADMIN"].includes(role);
  const showWorkManager = ["OWNER", "ADMIN", "UPLOADER"].includes(role);
  const showWorkspace = ["OWNER", "ADMIN", "UPLOADER", "EDITOR", "TRANSLATOR", "QC"].includes(role);
  const showPartnerPanel = role === "WORK_OWNER";
  
  // AQUI ESTÁ A MUDANÇA: Apenas OWNER vê a gestão de usuários
  const showUserManager = role === "OWNER";
  const showCodes = role === "OWNER";

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 text-[#FFD700] font-bold tracking-widest">
          ADMINISTRAÇÃO
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          
          <p className="text-xs font-bold text-zinc-500 uppercase px-2 mt-2 mb-2">Geral</p>
          <Link href="/dashboard" className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 transition-colors">
            <LayoutDashboard size={18} /> Visão Geral
          </Link>

          {/* PAINEL FINANCEIRO */}
          {showFinance && (
            <>
              <p className="text-xs font-bold text-zinc-500 uppercase px-2 mt-4 mb-2">Corporativo</p>
              <Link href="/dashboard/financeiro" className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg text-green-400 transition-colors">
                <Wallet size={18} /> Financeiro
              </Link>
            </>
          )}

          {/* PAINEL DE OBRAS (GESTÃO) */}
          {showWorkManager && (
            <>
              <p className="text-xs font-bold text-zinc-500 uppercase px-2 mt-4 mb-2">Acervo</p>
              <Link href="/dashboard/obras" className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg text-blue-400 transition-colors">
                <BookOpen size={18} /> Gestão de Obras
              </Link>
              {showCosmetics && (
                <Link href="/dashboard/cosmeticos" className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg text-purple-400 transition-colors">
                  <Paintbrush size={18} /> Cosméticos
                </Link>
              )}
            </>
          )}

          {/* FLUXO DE TRABALHO (WORKFLOW) */}
          {showWorkspace && (
            <>
              <p className="text-xs font-bold text-zinc-500 uppercase px-2 mt-4 mb-2">Produção</p>
              <Link href="/dashboard/workspace" className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg text-yellow-400 transition-colors">
                <FileText size={18} /> Minhas Tarefas
              </Link>
            </>
          )}

          {/* PAINEL DE PARCEIRO */}
          {showPartnerPanel && (
            <>
              <p className="text-xs font-bold text-zinc-500 uppercase px-2 mt-4 mb-2">Parceiro</p>
              <Link href="/dashboard/meus-titulos" className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg text-[#FFD700] transition-colors">
                <Crown size={18} /> Meus Títulos
              </Link>
            </>
          )}

          {/* MODERAÇÃO */}
          {showModeration && (
            <>
              <p className="text-xs font-bold text-zinc-500 uppercase px-2 mt-4 mb-2">Comunidade</p>
              <Link href="/dashboard/moderacao" className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg text-red-400 transition-colors">
                <ShieldAlert size={18} /> Moderação
              </Link>
            </>
          )}

          {/* --- ADMINISTRAÇÃO DO SISTEMA (SÓ OWNER) --- */}
          {(showUserManager || showCodes) && (
            <>
              <div className="text-xs font-bold text-zinc-500 uppercase px-4 mt-6 mb-2">Administração</div>
              
              {showUserManager && (
                 <Link 
                   href="/dashboard/users" 
                   className="flex items-center gap-3 p-2.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"
                 >
                    <Users size={18} /> 
                    <span className="font-medium">Usuários</span>
                 </Link>
              )}

              {showCodes && (
                 <Link 
                   href="/dashboard/codigos" 
                   className="flex items-center gap-3 p-2.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[#FFD700] transition-all"
                 >
                    <Ticket size={18} /> 
                    <span className="font-medium">Códigos & Presentes</span>
                 </Link>
              )}
            </>
          )}

        </nav>
        
        {/* Footer User */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-925">
           <div className="mb-3 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-xs">
                {name?.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-bold text-white truncate">{name}</p>
               <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{role}</p>
             </div>
           </div>
           <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
             <button className="flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 transition-colors w-full justify-start pl-1">
               <LogOut size={14} /> Sair do Painel
             </button>
           </form>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}