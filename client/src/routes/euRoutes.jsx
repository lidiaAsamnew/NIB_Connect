import { Route } from "react-router-dom";
import EuLayout from "../layouts/EuLayout.jsx";
import ComplianceDashboard from "../pages/eu/ComplianceDashboard.jsx";
import WeeklyAllocationStream from "../pages/eu/WeeklyAllocationStream.jsx";
import SectorReport from "../pages/eu/SectorReport.jsx";
import RegionReport from "../pages/eu/RegionReport.jsx";
import Orders from "../pages/eu/Orders.jsx";
import Vouchers from "../pages/eu/Vouchers.jsx";
import EscrowTransactions from "../pages/eu/EscrowTransactions.jsx";

export default function EuRoutes() {
  return (
    <Route path="/eu" element={<EuLayout />}>
      <Route index element={<ComplianceDashboard />} />
      <Route path="dashboard" element={<ComplianceDashboard />} />
      <Route path="weekly-allocation-stream" element={<WeeklyAllocationStream />} />
      <Route path="sector-report" element={<SectorReport />} />
      <Route path="region-report" element={<RegionReport />} />
      <Route path="orders" element={<Orders />} />
      <Route path="vouchers" element={<Vouchers />} />
      <Route path="escrow-transactions" element={<EscrowTransactions />} />
    </Route>
  );
}
