import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Get all messages
    const messages = await prisma.message.findMany({
      include: { worker: true },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 messages
    });

    // Get unique workers from messages
    const workerIds = [...new Set(messages.filter(m => m.workerId).map(m => m.workerId!))];

    const workers = await prisma.worker.findMany({
      where: { id: { in: workerIds } },
    });

    const workerMap = new Map(workers.map(w => [w.id, w]));

    // Group messages by worker
    const conversationsMap = new Map();

    for (const msg of messages) {
      if (!msg.workerId) continue;
      const worker = workerMap.get(msg.workerId);
      if (!worker) continue;

      if (!conversationsMap.has(msg.workerId)) {
        conversationsMap.set(msg.workerId, {
          workerId: worker.id,
          workerName: worker.name,
          workerRole: worker.role,
          phoneNumber: worker.phoneNumber,
          messages: [],
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
          status: "conversation",
        });
      }

      const conversation = conversationsMap.get(msg.workerId);

      // Determine direction: if sentAt is set, it came from a worker (inbound)
      // If sentAt is null but status is SENT, it was sent from the app (outbound)
      const direction = msg.status === "SENT" && !msg.sentAt ? "outbound" : "inbound";

      // Add message
      conversation.messages.unshift({
        id: msg.id,
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role,
        phoneNumber: worker.phoneNumber,
        direction: direction,
        message: msg.content,
        createdAt: msg.createdAt.toISOString(),
      });

      // Update last message info
      if (!conversation.lastMessage) {
        conversation.lastMessage = msg.content;
        conversation.lastMessageTime = msg.createdAt.toISOString();
      }

      // Count unread (inbound messages)
      if (direction === "inbound" && msg.status !== "READ") {
        conversation.unreadCount++;
      }

      // Determine status from message content
      const upperContent = msg.content.toUpperCase();
      if (upperContent === "YES" || upperContent === "Y") {
        conversation.status = "confirmed";
      } else if (upperContent === "NO" || upperContent === "N") {
        conversation.status = "declined";
      }
    }

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    return NextResponse.json({ conversations });

  } catch (error) {
    console.error("Failed to load messages:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}