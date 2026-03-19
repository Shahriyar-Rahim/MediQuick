import { BrowserRouter, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import InstallPrompt from "./components/InstallPrompt";

// Pages — public
import HomePage from "./pages/HomePage";
import MedicinesPage from "./pages/MedicinesPage";
import MedicinePage from "./pages/MedicinePage";
import ShopPage from "./pages/ShopPage";
import ShopsPage from "./pages/ShopsPage";
import AddPage from "./pages/AddPage";

// Pages — admin
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import AccountsPage from "./pages/admin/AccountsPage";

// Layout wrapper — NavBar + main content + Footer
const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-950">
    <NavBar />
    <main className="flex-1">{children}</main>
    <Footer />
    <InstallPrompt />
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
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/medicines"
            element={
              <Layout>
                <MedicinesPage />
              </Layout>
            }
          />
          <Route
            path="/medicines/:id"
            element={
              <Layout>
                <MedicinePage />
              </Layout>
            }
          />
          <Route
            path="/shops/:id"
            element={
              <Layout>
                <ShopPage />
              </Layout>
            }
          />
          <Route
            path="/shops"
            element={
              <Layout>
                <ShopsPage />
              </Layout>
            }
          />
          <Route
            path="/add"
            element={
              <Layout>
                <AddPage />
              </Layout>
            }
          />

          {/* ── Admin auth ── */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* ── Admin protected ── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/accounts"
            element={
              <ProtectedRoute>
                <Layout>
                  <AccountsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
