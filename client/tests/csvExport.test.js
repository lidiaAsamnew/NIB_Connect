import test from "node:test";
import assert from "node:assert/strict";
import { objectsToCsv } from "../src/utils/csvExport.js";

test("CSV export preserves negative numbers and protects formula-like text", () => {
  const csv = objectsToCsv(
    [{ amount: "-125.50", note: "=SUM(A1:A2)", label: "ሴላ, Addis" }],
    [
      { key: "amount", label: "Amount" },
      { key: "note", label: "Note" },
      { key: "label", label: "Label" },
    ]
  );

  assert.equal(
    csv,
    'Amount,Note,Label\r\n-125.50,"\'=SUM(A1:A2)","ሴላ, Addis"'
  );
});
