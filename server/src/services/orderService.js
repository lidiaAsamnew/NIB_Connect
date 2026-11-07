import { prisma } from "../lib/prisma.js";
import { calculateOrderTotals } from "../utils/money.js";
import { AppError } from "../utils/errors.js";

export async function createOrder(user, { voucherId, items }) {
  const startup = user.startupProfile;
  if (!startup) throw new AppError("Startup profile not found.", 404);

  // Everything inside this block succeeds together or is rolled back together
  return prisma.$transaction(async (tx) => {
    // 1. The voucher must exist, belong to this startup, be ALLOCATED and not expired
    const voucher = await tx.voucher.findUnique({ where: { id: voucherId } });
    if (!voucher || voucher.startupId !== startup.id) {
      throw new AppError("Voucher not found.", 404);
    }
    if (voucher.status !== "ALLOCATED") {
      throw new AppError("Voucher is not available. Only ALLOCATED vouchers can be used.", 409);
    }
    if (voucher.expiresAt && voucher.expiresAt <= new Date()) {
      throw new AppError("Voucher has expired.", 400);
    }

    // 2. Load the products with their supplier
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: { supplier: true },
    });
    if (products.length !== productIds.length) {
      throw new AppError("One or more products were not found.", 404);
    }

    // 3. Same supplier, supplier verified, products active
    const supplierId = products[0].supplierId;
    if (products.some((p) => p.supplierId !== supplierId)) {
      throw new AppError("All products must belong to the same supplier.", 400);
    }
    const supplier = products[0].supplier;
    if (!supplier.isVerified) {
      throw new AppError("Supplier is not verified.", 400);
    }
    if (products.some((p) => !p.isActive)) {
      throw new AppError("One or more products are not active.", 400);
    }

    // 4. Calculate the money
    const productById = new Map(products.map((p) => [p.id, p]));
    const lines = items.map((i) => {
      const product = productById.get(i.productId);
      return { product, quantity: i.quantity, unitPrice: product.price };
    });
    const totals = calculateOrderTotals(
      lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      supplier.discountRate
    );

    // 5. The voucher must cover the net amount
    if (voucher.amount.lt(totals.netAmountToPay)) {
      throw new AppError("Voucher balance is insufficient for this order.", 400);
    }

    // 6. Lock the voucher. The "where status = ALLOCATED" makes this safe if two
    //    requests try to use the same voucher at the same moment.
    const locked = await tx.voucher.updateMany({
      where: { id: voucher.id, status: "ALLOCATED" },
      data: { status: "COMMITTED_TO_ORDER" },
    });
    if (locked.count === 0) {
      throw new AppError("Voucher is no longer available.", 409);
    }

    // 7. Reduce stock. The "stockQuantity >= quantity" condition prevents overselling.
    for (const line of lines) {
      const updated = await tx.product.updateMany({
        where: { id: line.product.id, stockQuantity: { gte: line.quantity } },
        data: { stockQuantity: { decrement: line.quantity } },
      });
      if (updated.count === 0) {
        throw new AppError(`Insufficient stock for "${line.product.name}".`, 409);
      }
    }

    // 8. Create the order with its items, linked to the voucher
    return tx.order.create({
      data: {
        startupId: startup.id,
        supplierId,
        voucherId: voucher.id,
        grossAmount: totals.grossAmount,
        discountApplied: totals.discountApplied,
        netAmountToPay: totals.netAmountToPay,
        status: "PLACED",
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.unitPrice.times(l.quantity),
          })),
        },
      },
      include: { items: true },
    });
  });
}