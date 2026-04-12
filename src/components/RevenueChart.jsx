import React, { useMemo } from "react";
import { getCustomerInvoices, getInvoiceDate, getInvoicePaid, getInvoiceStatus, getInvoiceTotal } from "../utils/invoiceData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const toNumber = (value) => Number(value || 0);

function RevenueChart({ customers = [], invoices = [] }) {
  const monthlyData = useMemo(() => {
    const months = {};
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      months[key] = { month: key, billed: 0, collected: 0 };
    }

    const sourceInvoices = Array.isArray(invoices) && invoices.length > 0
      ? invoices
      : (Array.isArray(customers) ? customers.flatMap((customer) => getCustomerInvoices(customer, invoices)) : []);

    sourceInvoices.forEach((invoice) => {
      const dateStr = getInvoiceDate(invoice);
      if (!dateStr) return;

      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return;

      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      if (!months[key]) return;

      const total = Number(getInvoiceTotal(invoice) || 0);
      const paid = Number(getInvoicePaid(invoice) || 0);
      const status = String(getInvoiceStatus(invoice) || "").toLowerCase();

      months[key].billed += total;
      if (status === "paid") {
        months[key].collected += total;
      } else if (status === "partial") {
        months[key].collected += paid;
      }
    });

    return Object.values(months);
  }, [customers, invoices]);

  const formatCurrency = (value) => {
    if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `Rs ${(value / 1000).toFixed(0)}K`;
    return `Rs ${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5e7eb",
            borderRadius: "8px",
            padding: "10px 14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "13px",
          }}
        >
          <p style={{ fontWeight: "600", marginBottom: "6px", color: "#1f2937" }}>{label}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color, margin: "3px 0" }}>
              {entry.name}: Rs {Number(entry.value).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalBilled = monthlyData.reduce((sum, month) => sum + month.billed, 0);
  const totalCollected = monthlyData.reduce((sum, month) => sum + month.collected, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: 0 }}>Revenue Overview</h3>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "3px 0 0" }}>
            Last 6 months billing and collection trends
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ background: "#f5f3ff", borderRadius: "8px", padding: "6px 14px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "500" }}>Total Billed</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#6d28d9" }}>{formatCurrency(totalBilled)}</div>
          </div>
          <div style={{ background: "#ecfdf5", borderRadius: "8px", padding: "6px 14px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#059669", fontWeight: "500" }}>Collected</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#047857" }}>{formatCurrency(totalCollected)}</div>
          </div>
          <div
            style={{
              background: collectionRate >= 75 ? "#ecfdf5" : collectionRate >= 50 ? "#fef3c7" : "#fee2e2",
              borderRadius: "8px",
              padding: "6px 14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "500",
                color: collectionRate >= 75 ? "#059669" : collectionRate >= 50 ? "#d97706" : "#dc2626",
              }}
            >
              Collection Rate
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: collectionRate >= 75 ? "#047857" : collectionRate >= 50 ? "#b45309" : "#b91c1c",
              }}
            >
              {collectionRate}%
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
          <Area
            type="monotone"
            dataKey="billed"
            name="Billed"
            stroke="#7c3aed"
            strokeWidth={2.5}
            strokeDasharray="6 3"
            fill="url(#billedGrad)"
            dot={{ fill: "#7c3aed", r: 4, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="collected"
            name="Collected"
            stroke="#10b981"
            strokeWidth={2.5}
            strokeDasharray="0"
            fill="url(#collectedGrad)"
            dot={{ fill: "#10b981", r: 4, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;