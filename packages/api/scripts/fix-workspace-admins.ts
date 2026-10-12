import prisma from "@/database/prisma.ts";

// One-off data fix: sign-up used to create workspace memberships with the default MEMBER role,
// leaving single-member workspaces with no admin. Promote the sole member of each such workspace.
const workspaces = await prisma.workspace.findMany({
  where: { memberships: { none: { role: "ADMIN" } } },
  select: { id: true, memberships: { select: { userId: true } } },
});
const workspaceIds = workspaces
  .filter((workspace) => workspace.memberships.length === 1)
  .map((workspace) => workspace.id);

const { count } = await prisma.workspaceMembership.updateMany({
  where: { workspaceId: { in: workspaceIds } },
  data: { role: "ADMIN" },
});
console.log(`Promoted ${count} sole member(s) to admin.`);
await prisma.$disconnect();
