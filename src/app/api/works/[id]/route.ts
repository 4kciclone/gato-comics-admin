import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const workId = resolvedParams.id;

        const work = await prisma.work.findUnique({
            where: { id: workId }
        });

        if (!work) {
            return NextResponse.json({ error: "Work not found" }, { status: 404 });
        }

        return NextResponse.json(work);
    } catch (error) {
        console.error("Error fetching work:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
