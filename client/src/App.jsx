import { BrowserRouter, Routes, Route } from "react-router-dom";
import EscrowTester from "./pages/internal/EscrowTester";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1 className="p-4 text-2xl font-bold">NIB-Connect</h1>} />
        <Route path="/internal/escrow-tester" element={<EscrowTester />} />
      </Routes>
    </BrowserRouter>
  );
}