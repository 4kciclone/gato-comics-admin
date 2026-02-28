"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSettings(settingsObj: Record<string, string>) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
        return { success: false, error: "Sem permissão." };
    }

    try {
        for (const [key, value] of Object.entries(settingsObj)) {
            await prisma.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            });
        }

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Falha ao salvar configurações." };
    }
}
