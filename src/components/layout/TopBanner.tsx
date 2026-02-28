import { UserButton } from "@/components/auth/user-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/auth";

export async function TopBanner() {
    const session = await auth();

    return (
        <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/40 backdrop-blur-xl px-4 lg:px-6">
            <SidebarTrigger className="text-primary hover:text-primary/80 transition-colors" />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
                <UserButton user={session?.user} />
            </div>
        </header>
    );
}
