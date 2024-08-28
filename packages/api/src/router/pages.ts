import { TRPCError } from "@trpc/server";
import { router, procedure } from "./trpc.ts";
import {
  GetPageByIdSchema,
  GetProfilePageByUserIdSchema,
  GetRecentPagesWithTilesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "@/models/pages/schema.ts";
import {
  getPageById,
  getProfilePageByUserId,
  getRecentPages,
  getRecentPagesWithTiles,
  createPage,
  updatePage,
  deletePage,
} from "@/models/pages/pages.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  getById: procedure.input(GetPageByIdSchema).query(async ({ input }) => {
    const page = await getPageById(input);
    return page;
  }),

  getProfilePageByUserId: procedure
    .input(GetProfilePageByUserIdSchema)
    .query(async ({ input }) => {
      const page = await getProfilePageByUserId(input);
      return page;
    }),

  getRecent: procedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const pages = await getRecentPages(ctx.user.id);
    return pages;
  }),

  getRecentWithTiles: procedure
    .input(GetRecentPagesWithTilesSchema)
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const pages = await getRecentPagesWithTiles(ctx.user.id, input);
      return pages;
    }),

  create: procedure.input(CreatePageSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const page = await createPage(ctx.user.id, input);
    return page;
  }),

  update: procedure.input(UpdatePageSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const page = await updatePage(input);
    invalidateCachedPage(page.id);
    return page;
  }),

  delete: procedure.input(DeletePageSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const page = await deletePage(input);
    invalidateCachedPage(page.id);
    return page;
  }),
});
