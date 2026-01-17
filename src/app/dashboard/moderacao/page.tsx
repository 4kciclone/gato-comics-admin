import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModerationCard } from "@/components/moderation/moderation-card";
import { ShieldCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const session = await auth();
  const role = session?.user?.role;

  // Verificação de Segurança Dupla (Layout já faz, mas garantimos aqui)
  if (role !== "OWNER" && role !== "MODERATOR") {
    redirect("/dashboard");
  }

  // 1. Busca Denúncias Pendentes
  const pendingReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      comment: { include: { user: true } },
      post: { include: { user: true } },
      reporter: { select: { name: true } },
    },
  });

  // 2. Agrupamento (Mesmo conteúdo = Um Card)
  const groupedData = pendingReports.reduce((acc, report) => {
    const content = report.comment || report.post;
    if (!content) return acc; // Conteúdo já deletado

    const isComment = !!report.commentId;
    const contentId = content.id;
    const key = `${isComment ? 'c' : 'p'}-${contentId}`;

    if (!acc[key]) {
      acc[key] = {
        contentId: content.id,
        contentType: isComment ? 'COMMENT' : 'POST',
        contentBody: 'content' in content ? content.content : '',
        author: {
          id: content.user.id,
          name: content.user.name,
          image: content.user.image,
        },
        reports: []
      };
    }

    acc[key].reports.push({
      id: report.id,
      reason: report.reason,
      reporterName: report.reporter.name
    });

    return acc;
  }, {} as Record<string, any>);

  const items = Object.values(groupedData);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Fila de Moderação</h1>
        <p className="text-zinc-400">Analise e julgue o conteúdo reportado.</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <ShieldCheck className="w-16 h-16 text-green-600 mb-4 opacity-80" />
          <h3 className="text-xl font-bold text-white">Tudo Limpo!</h3>
          <p className="text-zinc-500">Nenhuma denúncia pendente no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ModerationCard key={item.contentId} data={item} />
          ))}
        </div>
      )}
    </div>
  );
}