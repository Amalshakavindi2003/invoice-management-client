import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { deriveInvoiceStatus, statusColor, toTitleCase } from "../utils/invoiceStatus";
import { generateInvoicePDF } from "../utils/invoicePdf";

const formatCurrency = (value) => `Rs ${(Number(value) || 0).toFixed(2)}`;

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.75 }}>
      <Typography sx={{ fontWeight: 600, color: "#444" }}>{label}</Typography>
      <Typography sx={{ textAlign: "right" }}>{value}</Typography>
    </Box>
  );
}

function InvoiceDetailsDialog({ invoice, open, onClose }) {
  if (!invoice) {
    return null;
  }

  const customer = invoice.customer || {};
  const pdfCustomer = {
    name: customer.name || invoice.vendor || "-",
    email: customer.email || "-",
    phone: customer.phone || "-",
    address: customer.address || "-",
    customerRef: customer.referenceCode || customer.customerRef || "-",
  };
  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  const status = deriveInvoiceStatus(invoice);
  const total = Number(invoice.totalAmount || invoice.amount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const balance = Math.max(0, total - paid);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Invoice Details</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <Box sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Customer</Typography>
            <Typography>Customer Ref: {customer.referenceCode || "-"}</Typography>
            <Typography>{customer.name || invoice.vendor || "-"}</Typography>
            <Typography>{customer.email || "-"}</Typography>
            <Typography>{customer.phone || "-"}</Typography>
            <Typography>{customer.address || "-"}</Typography>
          </Box>
          <Box sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Invoice Info</Typography>
            <InfoRow label="Date" value={invoice.date || "-"} />
            <InfoRow label="Due Date" value={invoice.dueDate || "-"} />
            <InfoRow
              label="Status"
              value={<Chip size="small" color={statusColor(status)} label={toTitleCase(status)} />}
            />
            <InfoRow label="Invoice ID" value={invoice.id} />
          </Box>
        </Box>

        <Typography sx={{ fontWeight: 700, mb: 1 }}>Line Items</Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          {lineItems.length === 0 ? (
            <Typography>No line items found.</Typography>
          ) : (
            lineItems.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const taxRate = Number(item.taxRate) || 0;
              const subtotal = quantity * unitPrice;
              const tax = (subtotal * taxRate) / 100;

              return (
                <Box
                  key={`${invoice.id}-detail-${index}`}
                  sx={{
                    p: 1.5,
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                    display: "grid",
                    gridTemplateColumns: "2fr repeat(4, 1fr)",
                    gap: 1,
                    alignItems: "center",
                    "@media (max-width: 700px)": {
                      gridTemplateColumns: "1fr",
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                  <Typography>Qty: {quantity}</Typography>
                  <Typography>Unit: {formatCurrency(unitPrice)}</Typography>
                  <Typography>Tax: {taxRate}%</Typography>
                  <Typography>Total: {formatCurrency(subtotal + tax)}</Typography>
                </Box>
              );
            })
          )}
        </Box>

        <Box sx={{ mt: 2, display: "grid", gap: 0.5 }}>
          <Typography>Subtotal: {formatCurrency(invoice.subtotal || invoice.amount)}</Typography>
          <Typography>Tax: {formatCurrency(invoice.taxTotal)}</Typography>
          <Typography>Discount: {formatCurrency(invoice.discount)}</Typography>
          <Typography>Total: {formatCurrency(total)}</Typography>
          <Typography>Paid Amount: {formatCurrency(paid)}</Typography>
          <Typography sx={{ color: balance > 0 ? "#b45309" : "#15803d", fontWeight: 700 }}>
            Balance: {formatCurrency(balance)}
          </Typography>
          <Typography>Paid Date: {invoice.paidDate || "-"}</Typography>
          <Typography>Payment Method: {invoice.paymentMethod || "-"}</Typography>
          <Typography>Reference: {invoice.paymentReference || "-"}</Typography>
          <Typography>Notes: {invoice.paymentNotes || "-"}</Typography>
          <Typography>Last Reminder: {invoice.reminderSentAt || "-"}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <button
          onClick={() => generateInvoicePDF(invoice, pdfCustomer)}
          style={{
            background: "#6d28d9",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 18px",
            fontWeight: "500",
            cursor: "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ⬇ Download PDF
        </button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InvoiceDetailsDialog;