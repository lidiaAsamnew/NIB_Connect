import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import beneficiaryRoutes from "./routes/beneficiaryRoutes";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PublicLayout />}>
        <Route path="/not-found" element={<NotFound />} />
      </Route>
      {beneficiaryRoutes()}
      {/* Other roles add their own routes files here in later weeks */}
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}
