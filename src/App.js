import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import Home from "./components/Home";
import Login from "./components/Login";
import CustomerInvoicePortal from "./components/CustomerInvoicePortal";
import "./index.css";

const isLoggedIn = () => {
  const token = localStorage.getItem("ei_token");
  if (!token) {
    return false;
  }

  return token.split(".").length === 3;
};

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ei_token");
    const stored = localStorage.getItem("ei_user");

    if (!token || token.split(".").length !== 3) {
      localStorage.removeItem("ei_token");
      localStorage.removeItem("ei_user");
      setUser(null);
      setChecking(false);
      return;
    }

    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (error) {
        localStorage.removeItem("ei_user");
        localStorage.removeItem("ei_token");
        setUser(null);
      }
    }

    setChecking(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("ei_token");
    localStorage.removeItem("ei_user");
    setUser(null);
  };

  if (checking) {
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn()
              ? <Navigate to="/" replace />
              : <Login onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route path="/my-invoices" element={<CustomerInvoicePortal />} />
        <Route
          path="/"
          element={
            isLoggedIn()
              ? (
                <>
                  <Header user={user} onLogout={handleLogout} />
                  <Home user={user} onLogout={handleLogout} />
                </>
              )
              : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;