import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import EuRoutes from "./routes/euRoutes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/eu/dashboard" replace />} />
        {EuRoutes()}
        <Route path="/compliance/dashboard" element={<Navigate to="/eu/dashboard" replace />} />
        <Route path="/compliance/weekly-stream" element={<Navigate to="/eu/weekly-allocation-stream" replace />} />
        <Route path="/compliance/sector-report" element={<Navigate to="/eu/sector-report" replace />} />
        <Route path="/compliance/region-report" element={<Navigate to="/eu/region-report" replace />} />
        <Route path="/compliance/orders" element={<Navigate to="/eu/orders" replace />} />
        <Route path="/compliance/vouchers" element={<Navigate to="/eu/vouchers" replace />} />
        <Route path="/compliance/escrow" element={<Navigate to="/eu/escrow-transactions" replace />} />
        <Route path="*" element={<Navigate to="/eu/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
