import { BrowserRouter, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages — public
import HomePage       from "./pages/HomePage";
import MedicinesPage  from "./pages/MedicinesPage";
import MedicinePage   from "./pages/MedicinePage";
import ShopPage       from "./pages/ShopPage";
import AddPage        from "./pages/AddPage";

// Pages — admin
import LoginPage      from "./pages/admin/LoginPage";
import DashboardPage  from "./pages/admin/DashboardPage";

// Layout wrapper — Navbar + main content + Footer
const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-950">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
          toastStyle={{
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid #334155",
            borderRadius: "10px",
            fontSize: "14px",
          }}
        />

        <Routes>
          {/* ── Public routes ── */}
          <Route
            path="/"
            element={<Layout><HomePage /></Layout>}
          />
          <Route
            path="/medicines"
            element={<Layout><MedicinesPage /></Layout>}
          />
          <Route
            path="/medicines/:id"
            element={<Layout><MedicinePage /></Layout>}
          />
          <Route
            path="/shops/:id"
            element={<Layout><ShopPage /></Layout>}
          />
          <Route
            path="/add"
            element={<Layout><AddPage /></Layout>}
          />

          {/* ── Admin auth ── */}
          <Route
            path="/admin/login"
            element={<LoginPage />}
          />

          {/* ── Admin protected ── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Layout><DashboardPage /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
