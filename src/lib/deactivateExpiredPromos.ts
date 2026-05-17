import { prisma } from "@/lib/prisma";

/**
 * Sets isActive=false for promos whose end time has passed.
 * Call from admin promo list so status stays in sync without a cron job.
 */
export async function deactivateExpiredPromos(): Promise<void> {
  await prisma.promoCode.updateMany({
    where: {
      isActive: true,
      endsAt: { lt: new Date() },
    },
    data: { isActive: false },
  });
}
