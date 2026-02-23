import { Prisma } from "@/generated/prisma/client";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

export default Prisma.defineExtension({
  name: "dates-extension",
  result: {
    tile: {
      startDate: {
        needs: { startDate: true },
        compute: ({ startDate }) => (startDate ? formatDate(startDate) : null),
      },
      endDate: {
        needs: { endDate: true },
        compute: ({ endDate }) => (endDate ? formatDate(endDate) : null),
      },
    },
  },
});
