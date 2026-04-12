import { Alert, Box, Button, Chip, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllCustomers, getAllInvoice } from "../Services/api";
import { deriveInvoiceStatus, statusColor, toTitleCase } from "../utils/invoiceStatus";
import { generateInvoicePDF } from "../utils/invoicePdf";
import InvoiceDetailsDialog from "./InvoiceDetailsDialog";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function CustomerInvoicePortal() {
  const [customerReference, setCustomerReference] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState(
    "Enter your customer reference. Optional: add last 4 phone digits for extra verification."
  );
  const [loading, setLoading] = useState(false);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const dateA = Date.parse(a.date || "") || 0;
      const dateB = Date.parse(b.date || "") || 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [invoices]);

  const resetState = () => {
    setCustomer(null);
    setInvoices([]);
  };

  const findMyInvoices = async () => {
    try {
      setErrorMessage("");
      setInfoMessage("");

      const normalizedReference = customerReference.trim().toUpperCase();
      if (!/^CUS-\d{6}$/.test(normalizedReference)) {
        setErrorMessage("Enter a valid customer reference (example: CUS-000001).");
        resetState();
        return;
      }

      const normalizedPhoneLast4 = phoneLast4.trim();
      if (normalizedPhoneLast4 && !/^\d{4}$/.test(normalizedPhoneLast4)) {
        setErrorMessage("Phone verification must be exactly 4 digits.");
        resetState();
        return;
      }

      setLoading(true);
      const [customersData, invoicesData] = await Promise.all([getAllCustomers(), getAllInvoice()]);
      const customers = Array.isArray(customersData) ? customersData : [];
      const allInvoices = Array.isArray(invoicesData) ? invoicesData : [];

      const matchedCustomer = customers.find(
        (item) => String(item.referenceCode || "").trim().toUpperCase() === normalizedReference
      );

      if (!matchedCustomer) {
        setErrorMessage("No customer found for this reference.");
        resetState();
        return;
      }

      if (normalizedPhoneLast4) {
        const safePhone = String(matchedCustomer.phone || "").replace(/\D/g, "");
        if (!safePhone.endsWith(normalizedPhoneLast4)) {
          setErrorMessage("Customer reference and phone verification do not match.");
          resetState();
          return;
        }
      }

      const linkedInvoices = allInvoices.filter(
        (invoice) => Number(invoice?.customer?.id) === Number(matchedCustomer.id)
      );

      setCustomer(matchedCustomer);
      setInvoices(linkedInvoices);

      if (!linkedInvoices.length) {
        setInfoMessage("Customer found, but no invoices are linked yet.");
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to fetch invoice details right now.");
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const customerInitials = (customer?.name || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8fafc", pb: 4 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
          padding: "40px 32px 48px",
          marginBottom: "-24px",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              size="small"
              sx={{
                color: "#ede9fe",
                borderColor: "#c4b5fd",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { borderColor: "#e9d5ff", backgroundColor: "rgba(255,255,255,0.08)" },
              }}
            >
              Admin Login
            </Button>
            <Button
              component={Link}
              to="/"
              variant="contained"
              size="small"
              sx={{
                background: "#ede9fe",
                color: "#4c1d95",
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { background: "#ddd6fe" },
              }}
            >
              Dashboard
            </Button>
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: "26px",
              fontWeight: "700",
              margin: "0 0 6px",
            }}
          >
            My Invoice Details
          </h1>
          <p style={{ color: "#c4b5fd", fontSize: "14px", margin: 0 }}>View and download your invoices securely</p>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "28px 28px",
            boxShadow: "0 4px 24px rgba(109,40,217,0.12)",
            border: "0.5px solid #ede9fe",
            marginBottom: "24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              margin: "0 0 4px",
              color: "#1f2937",
            }}
          >
            Find your invoices
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "0 0 20px",
            }}
          >
            Enter your customer reference to access your invoices
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <TextField sx={{ flex: "1 1 260px" }}
              label="Customer Reference"
              placeholder="CUS-000001"
              value={customerReference}
              onChange={(event) => setCustomerReference(event.target.value)}
              size="small"
              fullWidth
            />
            <TextField sx={{ flex: "1 1 260px" }}
              label="Last 4 digits of phone"
              placeholder="1403"
              value={phoneLast4}
              onChange={(event) => setPhoneLast4(event.target.value)}
              size="small"
              inputProps={{ maxLength: 4 }}
              fullWidth
            />
          </div>

          <button
            onClick={findMyInvoices}
            disabled={loading}
            style={{
              background: "#6d28d9",
              color: "white",
              borderRadius: "8px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%",
              marginTop: "16px",
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={(event) => {
              if (!loading) event.currentTarget.style.background = "#5b21b6";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "#6d28d9";
            }}
          >
            {loading ? "Searching..." : "VIEW MY INVOICES"}
          </button>

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {errorMessage}
            </Alert>
          )}
          {!errorMessage && infoMessage && (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              {infoMessage}
            </Alert>
          )}
        </div>
      </div>

      {customer && (
        <>
          <div style={{ maxWidth: "800px", margin: "0 auto 20px", padding: "0 16px" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "0.5px solid #e5e7eb",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "700",
                  flexShrink: 0,
                }}
              >
                {customerInitials || "CU"}
              </div>

              <div style={{ flex: 1, minWidth: "220px" }}>
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "17px",
                    color: "#1f2937",
                    marginBottom: "4px",
                  }}
                >
                  {customer.name}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>Email: {customer.email}</span>
                  <span>Phone: {customer.phone}</span>
                  <span>Address: {customer.address}</span>
                </div>
              </div>

              <div
                style={{
                  background: "#f5f3ff",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#7c3aed",
                    fontWeight: "500",
                    marginBottom: "2px",
                  }}
                >
                  Customer Ref
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#6d28d9",
                  }}
                >
                  {customer.referenceCode || customer.customerRef || "-"}
                </div>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "12px",
              }}
            >
              Your Invoices ({sortedInvoices.length})
            </h3>

            {!sortedInvoices.length && (
              <Typography sx={{ color: "#6b7280", mb: 1.5 }}>No invoices available.</Typography>
            )}

            {sortedInvoices.map((invoice) => {
              const status = deriveInvoiceStatus(invoice);
              const total = Number(invoice.total ?? invoice.totalAmount ?? invoice.amount ?? 0);
              const paid = Number(invoice.paid ?? invoice.paidAmount ?? 0);
              const balance = Number(invoice.balance ?? Math.max(0, total - paid));

              return (
                <div
                  key={invoice.id}
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px 24px",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "15px",
                        color: "#1f2937",
                        marginBottom: "6px",
                      }}
                    >
                      Invoice #{invoice.id}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>Issued: {formatDate(invoice.date)}</span>
                      <span>Due: {formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#1f2937",
                      }}
                    >
                      Rs {Number(total).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Balance:
                      <span
                        style={{
                          color: Number(balance) > 0 ? "#dc2626" : "#059669",
                          fontWeight: "600",
                          marginLeft: "4px",
                        }}
                      >
                        Rs {Number(balance).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "8px",
                    }}
                  >
                    <Chip size="small" color={statusColor(status)} label={toTitleCase(status)} />
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <Button size="small" variant="outlined" onClick={() => setSelectedInvoice(invoice)}>
                        View Details
                      </Button>
                      <button
                        onClick={() =>
                          generateInvoicePDF(invoice, {
                            name: customer?.name || invoice?.customer?.name || "-",
                            email: customer?.email || invoice?.customer?.email || "-",
                            phone: customer?.phone || invoice?.customer?.phone || "-",
                            address: customer?.address || invoice?.customer?.address || "-",
                            customerRef:
                              customer?.referenceCode ||
                              customer?.customerRef ||
                              invoice?.customer?.referenceCode ||
                              "-",
                          })
                        }
                        style={{
                          background: "#6d28d9",
                          color: "white",
                          borderRadius: "6px",
                          padding: "7px 14px",
                          fontSize: "13px",
                          fontWeight: 500,
                          border: "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background = "#5b21b6";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background = "#6d28d9";
                        }}
                      >
                        Download PDF
                      </button>
                    </Box>
                  </div>
                </div>
              );
            })}

            {!!sortedInvoices.length && (
              <div
                style={{
                  background: "#f5f3ff",
                  border: "1px solid #ede9fe",
                  borderRadius: "12px",
                  padding: "16px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "8px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#7c3aed",
                      fontWeight: "500",
                      marginBottom: "2px",
                    }}
                  >
                    Total Invoices
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#6d28d9",
                    }}
                  >
                    {sortedInvoices.length}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#7c3aed",
                      fontWeight: "500",
                      marginBottom: "2px",
                    }}
                  >
                    Total Billed
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#6d28d9",
                    }}
                  >
                    Rs {sortedInvoices.reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#059669",
                      fontWeight: "500",
                      marginBottom: "2px",
                    }}
                  >
                    Total Paid
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#047857",
                    }}
                  >
                    Rs {sortedInvoices
                      .reduce((s, i) => s + (i.status === "Paid" ? Number(i.total || 0) : Number(i.paid || 0)), 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#dc2626",
                      fontWeight: "500",
                      marginBottom: "2px",
                    }}
                  >
                    Balance Due
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#b91c1c",
                    }}
                  >
                    Rs {sortedInvoices.reduce((s, i) => s + Number(i.balance || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
      />
    </Box>
  );
}

export default CustomerInvoicePortal;