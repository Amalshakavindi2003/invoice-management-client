import { Box, Button, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import AddInvoice from "./AddInvoice";
import ActivityTimeline from "./ActivityTimeline";
import CustomerManager from "./CustomerManager";
import Reports from "./Reports";
import { getAllCustomers, getAllInvoice, saveInvoice } from "../Services/api";
import { normalizeInvoiceStatus } from "../utils/invoiceStatus";

const DASHBOARD_TABS = [
  { key: "reports", label: "Reports", icon: "\uD83D\uDCCA" },
  { key: "customers", label: "Customers", icon: "\uD83D\uDC65" },
  { key: "activity", label: "Activity", icon: "\uD83D\uDD50" },
];

const createLineItem = () => ({ description: "", qty: 1, unitPrice: 0, amount: 0 });

const addDays = (dateValue, days) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const getCustomerRef = (customer) => customer?.customerRef || customer?.referenceCode || "";

function Home() {
  const [addInvoice, setAddInvoice] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceCustomerId, setInvoiceCustomerId] = useState(null);
  const [activeTab, setActiveTab] = useState("reports");

  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => addDays(new Date().toISOString().slice(0, 10), 30));
  const [invoiceStatus, setInvoiceStatus] = useState("Draft");
  const [lineItems, setLineItems] = useState([createLineItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const loadInvoices = async () => {
    try {
      const data = await getAllInvoice();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error.message);
      setInvoices([]);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers();
      if (data) {
        console.log("Loaded customers:", data);
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading customers:", error.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!quickModalOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setQuickModalOpen(false);
        setModalError("");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [quickModalOpen]);

  const resetQuickForm = (preselectedId = "") => {
    const idText = preselectedId ? String(preselectedId) : "";
    const customer = customers.find((c) => String(c.id) === idText || getCustomerRef(c) === idText) || null;

    setSelectedCustomerId(idText);
    setSelectedCustomer(customer);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate(addDays(new Date().toISOString().slice(0, 10), 30));
    setInvoiceStatus("Draft");
    setLineItems([createLineItem()]);
    setTaxRate(0);
    setNotes("");
    setModalError("");
  };

  const openQuickInvoiceModal = (customerId = null) => {
    const idToSet = customerId !== null && customerId !== undefined ? String(customerId) : "";
    resetQuickForm(idToSet);
    setQuickModalOpen(true);
    setAddInvoice(false);
    setInvoiceCustomerId(customerId);
    setActiveTab("customers");
  };

  const handleInvoiceSaved = async () => {
    await loadInvoices();
    await loadCustomers();
    setInvoiceCustomerId(null);
  };

  const subtotal = useMemo(() => lineItems.reduce((s, i) => s + Number(i.amount || 0), 0), [lineItems]);
  const tax = useMemo(() => subtotal * (Number(taxRate || 0) / 100), [subtotal, taxRate]);

  const onLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const existing = updated[index];
      const next = { ...existing, [field]: field === "description" ? value : Number(value || 0) };
      next.amount = Number(next.qty || 0) * Number(next.unitPrice || 0);
      updated[index] = next;
      return updated;
    });
  };

  const addLineItem = () => setLineItems((prev) => [...prev, createLineItem()]);

  const removeLineItem = (index) => {
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmitInvoice = async () => {
    if (!selectedCustomer) {
      setModalError("Please select a customer.");
      return;
    }

    if (!invoiceDate || !dueDate) {
      setModalError("Please provide invoice and due dates.");
      return;
    }

    if (lineItems.some((item) => !String(item.description || "").trim())) {
      setModalError("Please fill description for all line items.");
      return;
    }

    setModalError("");
    setIsSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomer?.id || getCustomerRef(selectedCustomer),
        customer: { id: Number(selectedCustomer?.id) },
        vendor: selectedCustomer?.name || "",
        product: String(lineItems[0]?.description || "").trim(),
        date: invoiceDate,
        dueDate,
        status: invoiceStatus,
        action: normalizeInvoiceStatus(invoiceStatus),
        items: lineItems.map((item) => ({
          description: item.description,
          quantity: Number(item.qty || 0),
          unitPrice: Number(item.unitPrice || 0),
          amount: Number(item.amount || 0),
        })),
        lineItems: lineItems.map((item) => ({
          name: item.description,
          quantity: Number(item.qty || 0),
          unitPrice: Number(item.unitPrice || 0),
          taxRate: 0,
        })),
        subtotal,
        taxRate: Number(taxRate || 0),
        tax,
        taxTotal: tax,
        total: subtotal + tax,
        totalAmount: subtotal + tax,
        amount: Math.round(subtotal + tax),
        notes,
      };

      await saveInvoice(payload);
      setQuickModalOpen(false);
      await handleInvoiceSaved();
      setToast("Invoice created successfully!");
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setModalError(error.message || "Failed to create invoice. You can use Classic Form as fallback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ margin: 2.5 }}>
      <style>{`@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

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
          <Button variant="contained" onClick={() => openQuickInvoiceModal()}>
            Quick Invoice Creator
          </Button>

          {!addInvoice && (
            <Button
              variant="outlined"
              onClick={() => {
                setAddInvoice(true);
                setQuickModalOpen(false);
              }}
            >
              Use Classic Form
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
              Hide Classic Form
            </Button>
          )}
        </Box>
      )}

      {activeTab === "reports" && (<Reports customers={customers} invoices={invoices} loading={loading} />)}

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
            onCreateInvoiceForCustomer={openQuickInvoiceModal}
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

      {quickModalOpen && (
        <div
          onClick={() => {
            setQuickModalOpen(false);
            setModalError("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "16px",
              background: "#ffffff",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.9fr",
              gap: "16px",
              padding: "20px",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 12px", fontSize: "18px", color: "#1f2937" }}>Quick Invoice Creator</h3>

              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  Customer
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCustomerId(value);
                    const c = customers.find((x) => getCustomerRef(x) === value || String(x.id) === value) || null;
                    setSelectedCustomer(c);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => {
                    const ref = getCustomerRef(c) || String(c.id);
                    return (
                      <option key={ref} value={ref}>
                        {ref} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â {c.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                >
                  <option>Draft</option>
                  <option>Paid</option>
                  <option>Partial</option>
                  <option>Overdue</option>
                </select>
              </div>

              <div style={{ border: "1px solid #f3f4f6", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                <div
                  style={{
                    background: "#f9fafb",
                    fontSize: "12px",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    display: "grid",
                    gridTemplateColumns: "2fr 0.8fr 1fr 1fr auto",
                    gap: "8px",
                    padding: "10px",
                  }}
                >
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit Price</span>
                  <span style={{ textAlign: "right" }}>Amount</span>
                  <span />
                </div>

                {lineItems.map((item, index) => (
                  <div
                    key={`quick-item-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 0.8fr 1fr 1fr auto",
                      gap: "8px",
                      padding: "8px 10px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      value={item.description}
                      onChange={(e) => onLineItemChange(index, "description", e.target.value)}
                      placeholder="Description"
                      style={{ border: "none", borderBottom: "1px solid #f3f4f6", padding: "8px" }}
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => onLineItemChange(index, "qty", e.target.value)}
                      style={{ border: "none", borderBottom: "1px solid #f3f4f6", padding: "8px" }}
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => onLineItemChange(index, "unitPrice", e.target.value)}
                      style={{ border: "none", borderBottom: "1px solid #f3f4f6", padding: "8px" }}
                    />
                    <div style={{ textAlign: "right", fontWeight: 600, color: "#1f2937", paddingRight: "8px" }}>
                      Rs {Number(item.amount || 0).toLocaleString()}
                    </div>
                    {lineItems.length > 1 ? (
                      <button
                        onClick={() => removeLineItem(index)}
                        style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addLineItem}
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                Add Item
              </button>

              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span>Subtotal</span>
                  <span>Rs {subtotal.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    marginBottom: "4px",
                  }}
                >
                  <span>Tax %</span>
                  <input
                    type="number"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value || 0))}
                    style={{ width: "80px", padding: "6px", borderRadius: "6px", border: "1px solid #e5e7eb" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 700, color: "#6d28d9" }}>
                  <span>Total</span>
                  <span>Rs {(subtotal + tax).toLocaleString()}</span>
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Payment terms, bank details, thank you note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "10px", resize: "vertical" }}
              />

              {modalError && <div style={{ color: "#b91c1c", marginTop: "10px", fontSize: "13px" }}>{modalError}</div>}

              <button
                onClick={handleSubmitInvoice}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  background: "#6d28d9",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  marginTop: "16px",
                  opacity: isSubmitting ? 0.85 : 1,
                }}
              >
                {isSubmitting ? "Creating..." : "Create Invoice"}
              </button>

              <button
                onClick={() => {
                  setAddInvoice(true);
                  setQuickModalOpen(false);
                }}
                style={{
                  width: "100%",
                  background: "#fff",
                  color: "#6d28d9",
                  border: "1px solid #c4b5fd",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                Use Classic Form (Fallback)
              </button>
            </div>

            {!isMobile && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "24px",
                  fontSize: "12px",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    background: "#6d28d9",
                    color: "#fff",
                    margin: "-24px -24px 16px",
                    padding: "16px 24px",
                    borderRadius: "12px 12px 0 0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "700", fontSize: "16px" }}>EasyInvoice</span>
                  <span style={{ opacity: 0.8, fontSize: "12px" }}>INVOICE</span>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#6d28d9",
                      fontWeight: "600",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Bill To
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>{selectedCustomer?.name || "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â"}</div>
                  <div style={{ color: "#6b7280", fontSize: "11px" }}>{selectedCustomer?.email || ""}</div>
                  <div style={{ color: "#6b7280", fontSize: "11px" }}>{selectedCustomer?.phone || ""}</div>
                </div>

                <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "11px" }}>
                  <div>
                    <span style={{ color: "#9ca3af" }}>Date: </span>
                    {invoiceDate || "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â"}
                  </div>
                  <div>
                    <span style={{ color: "#9ca3af" }}>Due: </span>
                    {dueDate || "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â"}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", fontSize: "10px", color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>
                    <span style={{ flex: 2 }}>Description</span>
                    <span style={{ flex: 1, textAlign: "right" }}>Qty</span>
                    <span style={{ flex: 1, textAlign: "right" }}>Price</span>
                    <span style={{ flex: 1, textAlign: "right" }}>Amount</span>
                  </div>
                  {lineItems.map((item, i) => (
                    <div
                      key={`preview-${i}`}
                      style={{ display: "flex", fontSize: "11px", padding: "4px 0", borderBottom: "1px solid #f9fafb" }}
                    >
                      <span style={{ flex: 2, color: "#374151" }}>{item.description || "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â"}</span>
                      <span style={{ flex: 1, textAlign: "right" }}>{item.qty}</span>
                      <span style={{ flex: 1, textAlign: "right" }}>Rs {Number(item.unitPrice).toLocaleString()}</span>
                      <span style={{ flex: 1, textAlign: "right", fontWeight: "600" }}>
                        Rs {Number(item.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    borderTop: "2px solid #6d28d9",
                    paddingTop: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#6d28d9" }}>Total</span>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#6d28d9" }}>
                    Rs {(subtotal + tax).toLocaleString()}
                  </span>
                </div>

                {notes && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px",
                      background: "#f9fafb",
                      borderRadius: "6px",
                      fontSize: "10px",
                      color: "#6b7280",
                    }}
                  >
                    {notes}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#6d28d9",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 4px 20px rgba(109,40,217,0.35)",
            zIndex: 9999,
            animation: "slideIn 0.3s ease",
          }}
        >
          ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ {toast}
        </div>
      )}
    </Box>
  );
}

export default Home;