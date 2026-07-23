import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const rows = await p.forum.findMany({
  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  select: {
    id: true,
    title: true,
    slug: true,
    parentForumId: true,
    sortOrder: true,
    forumType: true,
    forumPurpose: true,
    isActive: true,
    readAccess: true,
    requiredMembershipRole: true,
    writeEnabled: true,
    description: true,
  },
});
console.log(JSON.stringify(rows, null, 2));
await p.$disconnect();
