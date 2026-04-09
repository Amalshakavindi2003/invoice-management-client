import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

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
  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Invoice Details</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <Box sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Customer</Typography>
            <Typography>{customer.name || invoice.vendor || "-"}</Typography>
            <Typography>{customer.email || "-"}</Typography>
            <Typography>{customer.phone || "-"}</Typography>
            <Typography>{customer.address || "-"}</Typography>
          </Box>
          <Box sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Invoice Info</Typography>
            <InfoRow label="Date" value={invoice.date || "-"} />
            <InfoRow label="Status" value={invoice.action || "pending"} />
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
          <Typography sx={{ fontWeight: 700 }}>
            Total: {formatCurrency(invoice.totalAmount || invoice.amount)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InvoiceDetailsDialog;