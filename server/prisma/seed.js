import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { hashOtp } from "../src/utils/otp.js";
import { calculateOrderTotals } from "../src/utils/money.js";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });
const D = (n) => new Prisma.Decimal(n);

async function main() {
  // Clear old data first (children before parents) so the seed can be re-run safely
  await prisma.escrowTransaction.deleteMany();
  await prisma.deliveryHandshake.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplierProfile.deleteMany();
  await prisma.startupProfile.deleteMany();
  await prisma.user.deleteMany();

  // 1 NIB System Operator (Abebe)
  const operator = await prisma.user.create({
    data: {
      phoneNumber: "+251900000001",
      email: "operator@nib.test",
      fullName: "Abebe Kebede",
      role: "NIB_SYSTEM_OPERATOR",
    },
  });

  // 1 Women Startup Owner with profile (Lidia)
  const startupUser = await prisma.user.create({
    data: {
      phoneNumber: "+251900000002",
      email: "startup@test.com",
      fullName: "Lidia Tadesse",
      role: "WOMEN_STARTUP_OWNER",
      startupProfile: {
        create: {
          businessName: "Lidia Agro Supplies",
          sector: "Agriculture",
          region: "Addis Ababa",
        },
      },
    },
    include: { startupProfile: true },
  });

  // 1 Tier-1 Supplier with profile (Melat), 10% discount, verified
  const supplierUser = await prisma.user.create({
    data: {
      phoneNumber: "+251900000003",
      email: "supplier@test.com",
      fullName: "Melat Bekele",
      role: "TIER1_SUPPLIER",
      supplierProfile: {
        create: {
          companyName: "Melat Construction Materials",
          tinNumber: "TIN0001234",
          discountRate: D(10),
          bankAccountNumber: "1000123456789",
          isVerified: true,
        },
      },
    },
    include: { supplierProfile: true },
  });

  const startup = startupUser.startupProfile;
  const supplier = supplierUser.supplierProfile;

  // 3 Products
  const cement = await prisma.product.create({
    data: { supplierId: supplier.id, name: "Cement 50kg", price: D(1000), stockQuantity: 100 },
  });
  const steel = await prisma.product.create({
    data: { supplierId: supplier.id, name: "Steel Rod 12mm", price: D(500), stockQuantity: 200 },
  });
  await prisma.product.create({
    data: { supplierId: supplier.id, name: "Roof Sheet", price: D(750), stockQuantity: 80 },
  });

  // Vouchers (each order needs its own voucher)
  const makeVoucher = (status) =>
    prisma.voucher.create({
      data: {
        startupId: startup.id,
        amount: D(50000),
        status,
        allocatedById: operator.id,
        expiresAt: new Date("2026-12-31T23:59:59.000Z"),
      },
    });

  await makeVoucher("ALLOCATED"); // free to use
  const voucherForPlaced = await makeVoucher("COMMITTED_TO_ORDER");
  const voucherForPending = await makeVoucher("COMMITTED_TO_ORDER");
  const voucherForCleared = await makeVoucher("REDEEMED_AND_SETTLED");

  // Helper: build an order with 2 cement + 4 steel (gross 4000, discount 400, net 3600)
  async function makeOrder(voucher, status, extra = {}) {
    const lines = [
      { product: cement, quantity: 2 },
      { product: steel, quantity: 4 },
    ];
    const totals = calculateOrderTotals(
      lines.map((l) => ({ unitPrice: l.product.price, quantity: l.quantity })),
      supplier.discountRate
    );
    return prisma.order.create({
      data: {
        startupId: startup.id,
        supplierId: supplier.id,
        voucherId: voucher.id,
        ...totals,
        status,
        ...extra,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            unitPrice: l.product.price,
            lineTotal: D(l.product.price).times(l.quantity),
          })),
        },
      },
    });
  }

  // Order 1: PLACED
  await makeOrder(voucherForPlaced, "PLACED");

  // Order 2: DELIVERED_PENDING_HANDSHAKE (test OTP is 123456, stored only as a hash)
  await makeOrder(voucherForPending, "DELIVERED_PENDING_HANDSHAKE", {
    waybillCode: "WB-20261026-8F3A21",
    otpSecureHash: hashOtp("123456"),
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    dispatchedAt: new Date(),
    arrivedAt: new Date(),
  });

  // Order 3: VERIFIED_AND_CLEARED, with its escrow transactions
  const cleared = await makeOrder(voucherForCleared, "VERIFIED_AND_CLEARED", {
    waybillCode: "WB-20261020-AAAAAA",
    clearedAt: new Date(),
  });

  await prisma.escrowTransaction.createMany({
    data: [
      {
        orderId: cleared.id,
        voucherId: voucherForCleared.id,
        direction: "DEBIT",
        amount: cleared.netAmountToPay,
        reference: `ESC-DBT-${cleared.id}`,
        description: "Escrow debit from beneficiary voucher commitment.",
      },
      {
        orderId: cleared.id,
        voucherId: voucherForCleared.id,
        direction: "CREDIT",
        amount: cleared.netAmountToPay,
        reference: `NIB-SEED-${cleared.id.slice(0, 6).toUpperCase()}`,
        description: "Supplier settlement credit after delivery handshake.",
      },
    ],
  });

  console.log("Seed complete. Test OTP for the pending order: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());