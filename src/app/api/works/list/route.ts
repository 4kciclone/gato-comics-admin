import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !["ADMIN", "OWNER", "ACCOUNTANT"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const works = await prisma.work.findMany({
            select: {
                id: true,
                title: true,
            },
            orderBy: {
                title: "asc"
            }
        });

        return NextResponse.json(works);
    } catch (error) {
        console.error("Error fetching works list:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
