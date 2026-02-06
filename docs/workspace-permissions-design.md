# Workspace Permissions Design

## Current State Analysis

### What exists today

The codebase has two levels of access control, both binary (has access or doesn't):

**Workspace level** — `WorkspaceMembership` is a simple join table with no role column. Any member can perform all workspace operations: rename/delete the workspace, invite/remove members, create pages, manage themes, and manage folders. There is no concept of ownership or admin privilege at the workspace level.

**Page level** — Pages have a single `authorId` (the creator). Other users can be granted access via `PageAccess`, but this grants implicit full edit access — there is no viewer/editor distinction. The `CollaborationPopover` UI hardcodes "Owner" for the author and "Editor" for everyone else, but this is cosmetic; the API doesn't differentiate.

### Gaps and risks in the current model

1. **Any workspace member can delete the workspace** — there's no owner protection.
2. **Any workspace member can remove any other member** — including the person who created the workspace.
3. **No read-only sharing** — you can publish a page publicly or give someone full edit access. There's no middle ground (e.g., sharing with a colleague for review without them being able to modify content).
4. **No workspace-level page visibility** — `listPages` filters to `authorId: userId`, so members can't see each other's pages. Workspace membership doesn't grant any page access.
5. **No folder-level permissions** — folders are user-scoped, not shared.
6. **Page invites don't specify a role** — `PageInvite` and `PageAccess` have no role field, so the invite flow can't differentiate between viewer and editor access.

---

## Recommended Permissions Model

### Design Principles

- **Additive permissions** — start with no access; roles grant capabilities.
- **Least privilege by default** — new members get the lowest useful role.
- **Inherited but overridable** — workspace role sets a baseline; page-level grants can narrow or widen access for specific resources.
- **Minimal schema changes** — add `role` enum fields to existing tables rather than introducing a separate permissions matrix.

---

### 1. Workspace Roles

Add a `role` field to `WorkspaceMembership` with three levels:

| Role | Description |
|---|---|
| `OWNER` | Full control. Can delete the workspace, manage billing (future), transfer ownership, and do everything an Admin can. Exactly one owner per workspace (the creator). Ownership can be transferred. |
| `ADMIN` | Can invite/remove members (except the owner), manage workspace settings (name, themes), and has Editor access to all pages in the workspace. |
| `MEMBER` | Can create pages, view workspace-level resources (themes, member list), and access pages they authored or were explicitly granted access to. Default role for new members. |

#### Schema change

```prisma
enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
}

model WorkspaceMembership {
  workspaceId String        @map("workspace_id") @db.Uuid
  userId      String        @map("user_id") @db.Uuid
  createdAt   DateTime      @default(now()) @map("created_at")
  role        WorkspaceRole @default(MEMBER)

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id(name: "id", [workspaceId, userId])
  @@index([workspaceId])
  @@map("workspace_memberships")
}
```

#### Capability matrix

| Action | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| Delete workspace | Yes | No | No |
| Update workspace settings | Yes | Yes | No |
| Invite members | Yes | Yes | No |
| Remove members | Yes | Yes (not owner) | No |
| Change member roles | Yes | No | No |
| Transfer ownership | Yes | No | No |
| Create pages | Yes | Yes | Yes |
| View all workspace pages | Yes | Yes | No |
| Manage themes | Yes | Yes | No |

#### Authorization enforcement

Add a `requireWorkspaceRole` helper in `middleware.ts` that extends `authenticatedWorkspaceProcedure` to also check the membership's `role` field:

```typescript
function requireWorkspaceRole(...roles: WorkspaceRole[]) {
  return authenticatedWorkspaceProcedure.use(async (opts) => {
    const membership = await prisma.workspaceMembership.findUnique({
      where: { id: { userId: opts.ctx.userId, workspaceId: opts.ctx.workspaceId } },
      select: { role: true },
    });
    if (!membership || !roles.includes(membership.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return opts.next({ ctx: { ...opts.ctx, role: membership.role } });
  });
}
```

Usage in routers:

```typescript
// Only owners can delete
delete: requireWorkspaceRole("OWNER")
  .input(DeleteWorkspaceSchema)
  .mutation(({ ctx }) => deleteWorkspace(ctx)),

// Owners and admins can invite
invite: requireWorkspaceRole("OWNER", "ADMIN")
  .input(InviteToWorkspaceSchema)
  .mutation(({ input, ctx }) => inviteToWorkspace(input, ctx)),
```

---

### 2. Page-Level Roles

Add a `role` field to both `PageAccess` and `PageInvite`:

| Role | Description |
|---|---|
| `EDITOR` | Can modify page content (tiles, sections, text, styles, settings). |
| `VIEWER` | Read-only access. Can view the page but cannot modify any content. |

#### Schema change

```prisma
enum PageRole {
  VIEWER
  EDITOR
}

model PageAccess {
  createdAt DateTime @default(now()) @map("created_at")
  userId    String   @map("user_id") @db.Uuid
  pageId    String   @map("page_id") @db.Uuid
  role      PageRole @default(VIEWER)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@id(name: "id", [userId, pageId])
  @@index([pageId])
  @@map("page_access")
}

model PageInvite {
  id        String   @id @default(uuid()) @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  creatorId String   @map("creator_id") @db.Uuid
  pageId    String   @map("page_id") @db.Uuid
  email     String
  key       String   @unique
  role      PageRole @default(VIEWER)

  creator User @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  page    Page @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([pageId, email])
  @@map("page_invites")
}
```

#### Effective page permission resolution

A user's effective permission on a page is the highest of:

1. **Author** — always full control (equivalent to owner).
2. **PageAccess role** — explicit VIEWER or EDITOR grant.
3. **Workspace role inheritance** — OWNER and ADMIN get implicit EDITOR access to all pages in their workspace; MEMBER gets no implicit page access.

```
effectiveRole(user, page):
  if page.authorId == user.id → OWNER (full control)
  if pageAccess exists → pageAccess.role
  if workspaceMembership.role in (OWNER, ADMIN) → EDITOR
  if page.published → VIEWER (anonymous)
  → NO_ACCESS
```

#### Authorization enforcement

Split `authenticatedPageProcedure` into two variants:

- **`pageViewProcedure`** — requires at least VIEWER access (used for reading page data).
- **`pageEditProcedure`** — requires EDITOR access or authorship (used for mutations).

The existing `authenticatedPageProcedure` query should be updated to also fetch the user's `PageAccess.role` and workspace membership role, then attach the resolved effective role to the context:

```typescript
export interface AuthenticatedPageProcedureContext extends AuthenticatedRequestContext {
  pageId: string;
  workspaceId: string;
  isAuthor: boolean;
  effectivePageRole: "OWNER" | "EDITOR" | "VIEWER";
}
```

This allows individual route handlers to make fine-grained decisions (e.g., only the author can delete a page or change its published state).

---

### 3. Workspace Invite Roles

Add a `role` field to `WorkspaceInvite` so the inviter can specify what role the new member will receive:

```prisma
model WorkspaceInvite {
  id          String        @id @default(uuid()) @db.Uuid
  createdAt   DateTime      @default(now()) @map("created_at")
  creatorId   String        @map("creator_id") @db.Uuid
  workspaceId String        @map("workspace_id") @db.Uuid
  email       String
  key         String        @unique
  role        WorkspaceRole @default(MEMBER)

  creator   User      @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, email])
  @@map("workspace_invites")
}
```

When `acceptWorkspaceInvite` creates the `WorkspaceMembership`, it should copy the `role` from the invite. Only OWNER can invite as ADMIN; ADMIN can invite as MEMBER.

---

## Additional Permission-Based Controls

### 4. Page-Level Action Permissions

Beyond the VIEWER/EDITOR split, certain page actions should be restricted to the page author only:

| Action | Author | EDITOR | VIEWER |
|---|---|---|---|
| View page content | Yes | Yes | Yes |
| Edit tiles, sections, text | Yes | Yes | No |
| Change page settings (title, theme, font, background) | Yes | Yes | No |
| Publish/unpublish page | Yes | No | No |
| Delete/restore page | Yes | No | No |
| Invite collaborators | Yes | Yes | No |
| Revoke collaborator access | Yes | No | No |
| Transfer page ownership | Yes | No | No |
| Change collaborator roles | Yes | No | No |

This means `updatePage` needs to distinguish between content edits (EDITOR-allowed) and ownership actions (author-only). The cleanest approach: keep `published`, `delete`, `restore`, and collaborator management as author-only checks (using the existing `authorId: userId` where-clause pattern), and allow EDITOR-role users to modify content fields.

### 5. Folder Visibility and Sharing

Currently folders are user-scoped (`Folder.userId`). Two options:

**Option A (recommended for now):** Keep folders personal but add workspace-level shared folders. Add an optional `shared` boolean to `Folder`. Shared folders are visible to all workspace members; personal folders remain private. This is low-effort and matches how most doc tools work.

**Option B (future):** Full folder-level permissions with inheritance to contained pages. This is significantly more complex (recursive permission resolution, permission propagation on move) and should only be pursued if there's a clear product need.

### 6. Public Link Permissions

The current `published` boolean gives anonymous users full read access. Consider extending this with more granular public sharing options:

```prisma
enum PublicAccess {
  NONE        // Not published (current: published = false)
  VIEW        // Read-only public access (current: published = true)
  DUPLICATE   // Viewers can duplicate/fork the page
}
```

This could be stored directly on the `Page` model, replacing the `published` boolean, or as a separate field alongside it.

### 7. Content Locking

For collaborative editing scenarios, consider a lightweight locking mechanism:

- **Page-level lock** — Author can lock a page to prevent edits from collaborators temporarily (e.g., during a presentation).
- **Section-level lock** — Lock individual sections so collaborators can edit the rest of the page.

This doesn't require a full permissions overhaul — a `locked` boolean on `Page` and/or `Section` that the edit middleware checks is sufficient. Only the author (or ADMIN) can toggle the lock.

### 8. Audit Trail

For accountability in shared workspaces, track who did what:

```prisma
model AuditEvent {
  id          String   @id @default(uuid()) @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  workspaceId String   @map("workspace_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  action      String   // e.g. "page.delete", "member.remove", "role.change"
  targetType  String   // e.g. "page", "user", "workspace"
  targetId    String   @map("target_id")
  metadata    Json?    // Additional context

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])
  @@map("audit_events")
}
```

This is particularly valuable once you have differentiated roles — workspace owners and admins would want to see activity like member removals, role changes, and page deletions.

---

## Implementation Priority

Recommended order based on impact and complexity:

### Phase 1 — Core roles (highest impact, moderate effort)
1. Add `WorkspaceRole` enum and `role` field to `WorkspaceMembership`.
2. Add `PageRole` enum and `role` field to `PageAccess` and `PageInvite`.
3. Add `role` field to `WorkspaceInvite`.
4. Migrate existing data: set workspace creators as OWNER, other members as MEMBER. Set all existing `PageAccess` rows to EDITOR (preserves current behavior).
5. Update `authenticatedWorkspaceProcedure` to load and expose the role.
6. Add `requireWorkspaceRole` middleware helper.
7. Split `authenticatedPageProcedure` into view/edit variants.
8. Gate workspace mutations (delete, update settings, invite, remove) by role.
9. Gate page mutations by effective page role.
10. Update the `CollaborationPopover` and workspace member UI to show actual roles and allow role selection when inviting.

### Phase 2 — Visibility and sharing improvements
11. Allow OWNER/ADMIN to see all workspace pages in `listPages`.
12. Add role selector to the page invite flow (VIEWER vs EDITOR).
13. Add role selector to the workspace invite flow (MEMBER vs ADMIN).
14. Add role change endpoints for both workspace and page level.

### Phase 3 — Extended controls
15. Shared folders (Option A above).
16. Content locking.
17. Extended public link options (DUPLICATE).
18. Audit trail.

---

## Migration Strategy

All schema changes can be made as **additive, non-breaking migrations**:

- New `role` columns use `@default()` values, so existing rows get a valid role automatically.
- The workspace creator detection for the OWNER migration can use the earliest `WorkspaceMembership.createdAt` per workspace as a heuristic, or you can add a `creatorId` field to `Workspace` and backfill it.
- Existing `PageAccess` rows should default to `EDITOR` to avoid regressions in current user access.
- The API changes are backward-compatible: existing clients that don't send a `role` field will get the default.
- The middleware changes are the main source of behavioral change — previously allowed actions may become forbidden. This should be tested thoroughly, especially around workspace deletion and member removal.
