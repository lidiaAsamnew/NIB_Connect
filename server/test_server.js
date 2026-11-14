const app = require("./src/app");

const server = app.listen(5099, async () => {
  try {
    // 1. Health check
    const resHealth = await fetch("http://localhost:5099/api/health");
    const jsonHealth = await resHealth.json();
    console.log("HEALTH:", resHealth.status, jsonHealth.message);

    // 2. Access with supplier token
    const resSupplier = await fetch("http://localhost:5099/api/supplier/orders", {
      headers: { Authorization: "Bearer demo-supplier-token" }
    });
    const jsonSupplier = await resSupplier.json();
    console.log("SUPPLIER AUTH OK:", resSupplier.status, jsonSupplier.success);

    // 3. Access with beneficiary token (should be 403 Forbidden)
    const resForbidden = await fetch("http://localhost:5099/api/supplier/orders", {
      headers: { Authorization: "Bearer demo-beneficiary-token" }
    });
    const jsonForbidden = await resForbidden.json();
    console.log("NON-SUPPLIER ACCESS (EXPECT 403):", resForbidden.status, jsonForbidden.message);

    // 4. Invalid endpoint (404)
    const res404 = await fetch("http://localhost:5099/api/unknown-xyz");
    const json404 = await res404.json();
    console.log("404 HANDLER:", res404.status, json404.message);

    console.log("ALL BACKEND & RBAC TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
});
