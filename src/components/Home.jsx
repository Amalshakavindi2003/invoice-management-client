import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import AddInvoice from "./AddInvoice";
import ActivityTimeline from "./ActivityTimeline";
import CustomerManager from "./CustomerManager";
import Reports from "./Reports";
import api from "../Services/api";

const DASHBOARD_TABS = [
  { key: "reports", label: "Reports", icon: "📊" },
  { key: "customers", label: "Customers", icon: "👥" },
  { key: "activity", label: "Activity", icon: "🕒" },
];

function Home() {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceCustomerId, setInvoiceCustomerId] = useState(null);

  const normalizeList = (data, fallbackKeys = []) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== "object") {
      return [];
    }

    for (const key of fallbackKeys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }

    return [];
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(normalizeList(data, ["customers", "content", "data"]));
    } catch (error) {
      console.error("Error loading customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await api.getInvoices();
      setInvoices(normalizeList(data, ["invoices", "content", "data"]));
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadInvoices();
  }, []);

  const handleCustomersChanged = async () => {
    await loadCustomers();
  };

  const handleInvoicesChanged = async () => {
    await loadInvoices();
  };

  const openInvoiceForm = (customerId = null) => {
    setInvoiceCustomerId(customerId);
    setShowInvoiceForm(true);
    setActiveTab("customers");
  };

  const handleInvoiceSaved = async () => {
    await Promise.all([loadCustomers(), loadInvoices()]);
    setShowInvoiceForm(false);
    setInvoiceCustomerId(null);
  };

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

      {activeTab === "reports" && <Reports customers={customers} invoices={invoices} loading={loading} />}

      {activeTab === "customers" && (
        <Box sx={{ mt: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
            {!showInvoiceForm ? (
              <Button variant="contained" onClick={() => openInvoiceForm()}>
                Add Invoice
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={() => {
                  setShowInvoiceForm(false);
                  setInvoiceCustomerId(null);
                }}
              >
                Hide Invoice Form
              </Button>
            )}
          </Box>

          {showInvoiceForm && (
            <AddInvoice
              setAddInvoice={setShowInvoiceForm}
              customers={customers}
              onSaved={handleInvoiceSaved}
              initialCustomerId={invoiceCustomerId}
            />
          )}

          <CustomerManager
            customers={customers}
            invoices={invoices}
            onCustomersChanged={handleCustomersChanged}
            onInvoicesChanged={handleInvoicesChanged}
            onCreateInvoiceForCustomer={openInvoiceForm}
          />
        </Box>
      )}

      {activeTab === "activity" && (
        <Box
          sx={{
            mt: 2,
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