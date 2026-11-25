import { generateOtp, hashOtp } from "./utils/otp.js";
import { calculateOrderTotals } from "./utils/money.js";
import { generateReference } from "./utils/reference.js";

const otp = generateOtp();
console.log("OTP:", otp, "| Hash:", hashOtp(otp));

const totals = calculateOrderTotals(
  [
    { unitPrice: 1000, quantity: 2 },
    { unitPrice: 500, quantity: 4 },
  ],
  10
);
console.log("Gross:", totals.grossAmount.toString());
console.log("Discount:", totals.discountApplied.toString());
console.log("Net:", totals.netAmountToPay.toString());

console.log("Reference:", generateReference("ESC"));