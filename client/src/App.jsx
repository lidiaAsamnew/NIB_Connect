import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import EuRoutes from "./routes/euRoutes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/eu/dashboard" replace />} />
        {EuRoutes()}
        <Route path="*" element={<Navigate to="/eu/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
