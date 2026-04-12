import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Header from "./components/Header";
import Login from "./components/Login";
import CustomerInvoicePortal from "./components/CustomerInvoicePortal";
import { isLoggedIn } from "./utils/auth";
import "./index.css";

const ProtectedRoute = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
};

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("ei_user") || "null"));

  const handleLoginSuccess = (userData) => {
    setUser({
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn() ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
          }
        />

        <Route path="/my-invoices" element={<CustomerInvoicePortal />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Header user={user} />
              <Home />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={isLoggedIn() ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;