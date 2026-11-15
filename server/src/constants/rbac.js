const { USER_ROLES } = require("./roles");

const RBAC_PERMISSIONS = Object.freeze({
  profile: Object.freeze({
    readOwn: USER_ROLES,
    updateOwn: Object.freeze(["TIER1_SUPPLIER", "WOMEN_STARTUP_OWNER"]),
  }),
  vouchers: Object.freeze({
    create: Object.freeze(["NIB_SYSTEM_OPERATOR"]),
    readAll: Object.freeze(["NIB_SYSTEM_OPERATOR"]),
    readOwn: Object.freeze(["WOMEN_STARTUP_OWNER"]),
    readSummary: Object.freeze(["EU_COMPLIANCE_OFFICER"]),
  }),
  products: Object.freeze({
    readVerified: Object.freeze(["WOMEN_STARTUP_OWNER"]),
    manageOwn: Object.freeze(["TIER1_SUPPLIER"]),
    readAll: Object.freeze(["NIB_SYSTEM_OPERATOR"]),
    readAggregate: Object.freeze(["EU_COMPLIANCE_OFFICER"]),
  }),
  orders: Object.freeze({
    createOwn: Object.freeze(["WOMEN_STARTUP_OWNER"]),
    readOwn: Object.freeze(["WOMEN_STARTUP_OWNER"]),
    dispatchOwn: Object.freeze(["TIER1_SUPPLIER"]),
    readAll: Object.freeze(["NIB_SYSTEM_OPERATOR"]),
    readAggregate: Object.freeze(["EU_COMPLIANCE_OFFICER"]),
  }),
  settlements: Object.freeze({
    readOwn: Object.freeze(["WOMEN_STARTUP_OWNER", "TIER1_SUPPLIER"]),
    readAll: Object.freeze(["NIB_SYSTEM_OPERATOR"]),
    readAggregate: Object.freeze(["EU_COMPLIANCE_OFFICER"]),
  }),
  supplierVerification: Object.freeze({
    submitOwn: Object.freeze(["TIER1_SUPPLIER"]),
    approve: Object.freeze(["NIB_SYSTEM_OPERATOR"]),
  }),
  auditLogs: Object.freeze({
    read: Object.freeze(["NIB_SYSTEM_OPERATOR"]),
  }),
  securityEvents: Object.freeze({
    read: Object.freeze(["NIB_SYSTEM_OPERATOR"]),
  }),
  euReports: Object.freeze({
    read: Object.freeze(["EU_COMPLIANCE_OFFICER"]),
  }),
});

function getAllowedRoles(resource, action) {
  const permissions = RBAC_PERMISSIONS[resource];
  if (!permissions || !permissions[action]) {
    throw new Error(`Unknown RBAC permission: ${resource}.${action}`);
  }
  return permissions[action];
}

module.exports = { getAllowedRoles, RBAC_PERMISSIONS };
