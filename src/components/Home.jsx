import { Box, Button, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import AddInvoice from "./AddInvoice";
import ActivityTimeline from "./ActivityTimeline";
import CustomerManager from "./CustomerManager";
import RevenueChart from "./RevenueChart";
import { getAllCustomers, getAllInvoice } from "../Services/api";

const DASHBOARD_TABS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "customers", label: "Customers", icon: "👥" },
  { key: "activity", label: "Activity", icon: "🕐" },
];

const formatStatCurrency = (value) =>
  `Rs ${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Home() {
  const [addInvoice, setAddInvoice] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoiceCustomerId, setInvoiceCustomerId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadInvoices = async () => {
    try {
      const response = await getAllInvoice();
      setInvoices(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error.message);
      setInvoices([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await getAllCustomers();
      setCustomers(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch customers:", error.message);
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, []);

  const openInvoiceForCustomer = (customerId = null) => {
    setInvoiceCustomerId(customerId);
    setAddInvoice(true);
    setActiveTab("customers");
  };

  const handleInvoiceSaved = async () => {
    await loadInvoices();
    await loadCustomers();
    setInvoiceCustomerId(null);
  };

  const stats = useMemo(() => {
    const safeCustomers = Array.isArray(customers) ? customers : [];

    const totalBilled = safeCustomers.reduce((sum, c) => {
      const customerInvoices = c.invoiceList || c.invoices || [];
      return sum + customerInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0);
    }, 0);

    const collected = safeCustomers.reduce((sum, c) => {
      const customerInvoices = c.invoiceList || c.invoices || [];
      return (
        sum +
        customerInvoices.reduce((s, inv) => {
          if (inv.status === "Paid") return s + Number(inv.total || 0);
          if (inv.status === "Partial") return s + Number(inv.paid || 0);
          return s;
        }, 0)
      );
    }, 0);

    const outstanding = safeCustomers.reduce((sum, c) => {
      const customerInvoices = c.invoiceList || c.invoices || [];
      return (
        sum +
        customerInvoices.reduce((s, inv) => {
          if (inv.status !== "Paid") return s + Number(inv.balance || 0);
          return s;
        }, 0)
      );
    }, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = safeCustomers.reduce((sum, c) => {
      const customerInvoices = c.invoiceList || c.invoices || [];
      return (
        sum +
        customerInvoices.reduce((s, inv) => {
          const due = new Date(inv.dueDate);
          if (due < today && inv.status !== "Paid") return s + Number(inv.balance || 0);
          return s;
        }, 0)
      );
    }, 0);

    return { totalBilled, collected, outstanding, overdue };
  }, [customers]);

  const statCards = [
    {
      label: "Total Billed",
      value: stats.totalBilled,
      accent: "#7e22ce",
      bg: "#faf5ff",
    },
    {
      label: "Collected",
      value: stats.collected,
      accent: "#15803d",
      bg: "#f0fdf4",
    },
    {
      label: "Outstanding",
      value: stats.outstanding,
      accent: "#b45309",
      bg: "#fffbeb",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      accent: "#b91c1c",
      bg: "#fef2f2",
    },
  ];

  return (
    <Box sx={{ margin: 2.5 }}>
      <Typography sx={{ fontSize: 30, fontWeight: 700 }}>Invoice Operations</Typography>

      <Box
        sx={{
          mt: 1.5,
          display: "flex",
          gap: "4px",
          borderBottom: "1px solid #e5e7eb",
          flexWrap: "wrap",
        }}
      >
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Box
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: "20px",
                py: "10px",
                fontSize: "14px",
                cursor: "pointer",
                userSelect: "none",
                color: isActive ? "#6d28d9" : "#6b7280",
                borderBottom: isActive ? "2px solid #6d28d9" : "2px solid transparent",
                fontWeight: isActive ? 600 : 500,
                background: "transparent",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </Box>
          );
        })}
      </Box>

      {activeTab === "customers" && (
        <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
          {!addInvoice && (
            <Button variant="outlined" onClick={() => openInvoiceForCustomer()}>
              Add Invoice
            </Button>
          )}
          {addInvoice && (
            <Button
              variant="outlined"
              onClick={() => {
                setAddInvoice(false);
                setInvoiceCustomerId(null);
              }}
            >
              Hide Invoice Form
            </Button>
          )}
        </Box>
      )}

      {activeTab === "overview" && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
              gap: 1.5,
              mb: 2,
              "@media (max-width: 1100px)": {
                gridTemplateColumns: "repeat(2, minmax(160px, 1fr))",
              },
              "@media (max-width: 700px)": {
                gridTemplateColumns: "1fr",
              },
            }}
          >
            {statCards.map((card) => (
              <Box
                key={card.label}
                sx={{
                  border: `1px solid ${card.accent}33`,
                  borderRadius: 2,
                  backgroundColor: card.bg,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: card.accent, letterSpacing: 0.3 }}>
                  {card.label}
                </Typography>
                <Typography sx={{ fontSize: 33, fontWeight: 700, color: card.accent, mt: 0.5 }}>
                  {formatStatCurrency(card.value)}
                </Typography>
              </Box>
            ))}
          </Box>

          <RevenueChart customers={customers} invoices={invoices} />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setActiveTab("customers")}
              style={{
                color: "#6d28d9",
                fontSize: "13px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: 600,
                padding: 0,
              }}
            >
              {"View All Customers →"}
            </button>
          </Box>
        </Box>
      )}

      {activeTab === "customers" && (
        <>
          {addInvoice && (
            <AddInvoice
              setAddInvoice={setAddInvoice}
              customers={customers}
              onSaved={handleInvoiceSaved}
              initialCustomerId={invoiceCustomerId}
            />
          )}

          <CustomerManager
            customers={customers}
            invoices={invoices}
            onCustomersChanged={loadCustomers}
            onInvoicesChanged={loadInvoices}
            onCreateInvoiceForCustomer={openInvoiceForCustomer}
          />
        </>
      )}

      {activeTab === "activity" && (
        <Box
          sx={{
            marginTop: 2,
            padding: 2,
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            background: "#fff",
          }}
        >
          <ActivityTimeline customers={customers} invoices={invoices} />
        </Box>
      )}
    </Box>
  );
}

export default Home;