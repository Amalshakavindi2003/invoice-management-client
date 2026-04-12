import React, { useState } from "react";

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handle = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const submit = async () => {
    setError("");

    if (isRegister) {
      if (!form.fullName.trim()) {
        setError("Full name is required");
        return;
      }

      if (form.password !== form.confirm) {
        setError("Passwords do not match");
        return;
      }

      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    if (!form.email.includes("@")) {
      setError("Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { fullName: form.fullName, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Something went wrong");
        return;
      }

      localStorage.setItem("ei_token", data.token);
      localStorage.setItem(
        "ei_user",
        JSON.stringify({
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        })
      );

      onLoginSuccess(data);
    } catch (err) {
      setError("Cannot connect to server. Is Spring Boot running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      submit();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #6d28d9 0%, #4338ca 50%, #1d4ed8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "40px",
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6d28d9, #4338ca)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "18px",
              fontWeight: "800",
            }}
          >
            E
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", lineHeight: 1 }}>EasyInvoice</div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Invoice Management System</div>
          </div>
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1f2937", margin: "0 0 6px" }}>
          {isRegister ? "Create account" : "Welcome back"}
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>
          {isRegister ? "Set up your admin account to get started" : "Sign in to your admin dashboard"}
        </p>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {isRegister && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
              Full Name
            </label>
            <input
              name="fullName"
              type="text"
              placeholder="Amalsha Kavindi"
              value={form.fullName}
              onChange={handle}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "1.5px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "border .15s",
                boxSizing: "border-box",
              }}
              onFocus={(event) => {
                event.target.style.borderColor = "#6d28d9";
              }}
              onBlur={(event) => {
                event.target.style.borderColor = "#e5e7eb";
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
            Email address
          </label>
          <input
            name="email"
            type="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={handle}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: "11px 14px",
              border: "1.5px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              transition: "border .15s",
              boxSizing: "border-box",
            }}
            onFocus={(event) => {
              event.target.style.borderColor = "#6d28d9";
            }}
            onBlur={(event) => {
              event.target.style.borderColor = "#e5e7eb";
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handle}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                padding: "11px 44px 11px 14px",
                border: "1.5px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "border .15s",
                boxSizing: "border-box",
              }}
              onFocus={(event) => {
                event.target.style.borderColor = "#6d28d9";
              }}
              onBlur={(event) => {
                event.target.style.borderColor = "#e5e7eb";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                color: "#6b7280",
                padding: "0",
              }}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        {isRegister && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
              Confirm Password
            </label>
            <input
              name="confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={handle}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "1.5px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "border .15s",
                boxSizing: "border-box",
              }}
              onFocus={(event) => {
                event.target.style.borderColor = "#6d28d9";
              }}
              onBlur={(event) => {
                event.target.style.borderColor = "#e5e7eb";
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#a78bfa" : "linear-gradient(135deg, #6d28d9, #4338ca)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "13px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "8px",
          }}
        >
          {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
        </button>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#6b7280" }}>
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsRegister((prev) => !prev);
              setError("");
              setForm({ fullName: "", email: "", password: "", confirm: "" });
            }}
            style={{
              background: "none",
              border: "none",
              color: "#6d28d9",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {isRegister ? "Sign in" : "Create account"}
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #f3f4f6",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          Are you a customer?{" "}
          <a href="/my-invoices" style={{ color: "#6d28d9", textDecoration: "none", fontWeight: "500" }}>
            View your invoices
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;