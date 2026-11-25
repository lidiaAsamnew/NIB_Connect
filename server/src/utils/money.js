import { Prisma } from "../../generated/prisma/client";

const Decimal = Prisma.Decimal;

// items: [{ unitPrice, quantity }]
// discountRate: a percent, e.g. 10 means 10%
export function calculateOrderTotals(items, discountRate) {
  const gross = items.reduce(
    (sum, item) => sum.plus(new Decimal(item.unitPrice).times(item.quantity)),
    new Decimal(0)
  );
  const discount = gross.times(new Decimal(discountRate).div(100));
  const net = gross.minus(discount);

  return {
    grossAmount: gross.toDecimalPlaces(2),
    discountApplied: discount.toDecimalPlaces(2),
    netAmountToPay: net.toDecimalPlaces(2),
  };
}