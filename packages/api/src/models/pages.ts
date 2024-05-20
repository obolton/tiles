import type { Page } from "@prisma/client";
import prisma from "../database/prisma.js";

export async function getPage(id: string) {
  return prisma.page.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      title: true,
    },
  });
}

export async function createPage({
  authorId,
  title,
}: Pick<Page, "authorId" | "title">) {
  return prisma.page.create({
    data: {
      authorId,
      title,
    },
    select: {
      id: true,
      title: true,
    },
  });
}

export async function updatePage(id: string, { title }: Pick<Page, "title">) {
  return prisma.page.update({
    where: { id },
    data: { title },
    select: {
      id: true,
      title: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
