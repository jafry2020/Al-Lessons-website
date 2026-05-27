import { Routes, Route, Navigate } from "react-router-dom";
import { TopNav } from "./components/layout/TopNav";
import { Footer } from "./components/layout/Footer";
import { Landing } from "./pages/Landing";
import { Lesson } from "./pages/Lesson";

export default function App() {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col">
      <TopNav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/tracks/ml-engineer/neural-networks/optimizers"
            element={<Lesson />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
