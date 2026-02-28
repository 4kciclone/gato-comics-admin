import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
    try {
        const resolvedParams = await params;
        const { chapterId } = resolvedParams;

        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId }
        });

        if (!chapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        return NextResponse.json(chapter);
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
