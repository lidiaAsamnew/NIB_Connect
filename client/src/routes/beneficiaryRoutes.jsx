import { Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import BeneficiaryLayout from "../layouts/BeneficiaryLayout";
import Dashboard from "../pages/beneficiary/Dashboard";
import Placeholder from "../pages/beneficiary/Placeholder";
import StartupProfile from "../pages/beneficiary/StartupProfile";
import Vouchers from "../pages/beneficiary/Vouchers";
import { ROLES } from "../utils/constants";

const PAGES = [
  ["/products", "Products"],
  ["/orders", "My Orders"],
  ["/notifications", "Notifications"],
];

// Call this as a function inside <Routes> so React Router sees the <Route> elements.
export default function beneficiaryRoutes() {
  return (
    <Route
      element={
        <ProtectedRoute allowedRoles={[ROLES.STARTUP_OWNER]}>
          <BeneficiaryLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/startup/profile" element={<StartupProfile />} />
      <Route path="/vouchers" element={<Vouchers />} />
      {PAGES.map(([path, title]) => (
        <Route key={path} path={path} element={<Placeholder title={title} />} />
      ))}
    </Route>
  );
}
