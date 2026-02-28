import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings/SettingsForm";

export default async function SettingsModulePage() {
    const dbSettings = await prisma.setting.findMany();
    const initialSettings: Record<string, string> = {};

    dbSettings.forEach(s => {
        initialSettings[s.key] = s.value;
    });

    return (
        <SettingsForm initialSettings={initialSettings} />
    );
}
