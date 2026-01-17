"use client";

import { useState, useTransition } from "react";
import { addStaffToWork, removeStaffFromWork } from "@/actions/work-staff"; // Vamos criar essa action depois
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  user: { name: string | null; email: string; image: string | null };
  role: "EDITOR" | "TRANSLATOR" | "QC";
}

export function WorkStaffManager({ workId, initialStaff }: { workId: string, initialStaff: StaffMember[] }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("TRANSLATOR");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!email) return toast.error("Digite o email do usuário");
    
    startTransition(async () => {
      const res = await addStaffToWork(workId, email, role as any);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Membro adicionado à equipe!");
        setEmail("");
      }
    });
  };

  const handleRemove = (staffId: string) => {
    startTransition(async () => {
      await removeStaffFromWork(staffId);
      toast.success("Membro removido.");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          placeholder="Email do funcionário..." 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="bg-zinc-950 border-zinc-800 text-white"
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[180px] bg-zinc-950 border-zinc-800 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            <SelectItem value="TRANSLATOR">Tradutor</SelectItem>
            <SelectItem value="EDITOR">Editor (Redraw)</SelectItem>
            <SelectItem value="QC">Quality Check</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={isPending} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-2">
        {initialStaff.length === 0 && <p className="text-sm text-zinc-500 italic">Nenhuma equipe designada.</p>}
        
        {initialStaff.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-zinc-700">
                <AvatarImage src={member.user.image || ""} />
                <AvatarFallback>{member.user.name?.slice(0,1)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">{member.user.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold">
                  {member.role}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleRemove(member.id)} className="text-red-500 hover:bg-red-950/30">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}