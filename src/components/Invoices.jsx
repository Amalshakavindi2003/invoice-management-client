import {
  Box,
  Button,
  TableCell,
  Table,
  TableHead,
  TableRow,
  TableBody,
  Typography,
  styled,
} from "@mui/material";

const StyledTable = styled(Table)(() => ({
  margin: 20,
  marginTop: 40,
  width: "95%",
  "& > thead > tr > th": {
    background: "#9C27B0",
    color: "#FFFFFF",
    fontSize: 18,
  },
  "& > tbody > tr > td": {
    fontSize: 15,
    verticalAlign: "top",
  },
}));

const formatCurrency = (value) => `Rs ${(Number(value) || 0).toFixed(2)}`;

function Invoices({ invoices, removeInvoice }) {
  if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
    return <Typography sx={{ marginTop: 3 }}>No Pending invoices</Typography>;
  }

  return (
    <StyledTable>
      <TableHead>
        <TableRow>
          <TableCell>Customer</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Phone</TableCell>
          <TableCell>Items</TableCell>
          <TableCell>Subtotal</TableCell>
          <TableCell>Tax</TableCell>
          <TableCell>Discount</TableCell>
          <TableCell>Total</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invoices.map((invoice) => {
          const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
          const customer = invoice.customer || {};

          return (
            <TableRow key={invoice.id}>
              <TableCell>{customer.name || invoice.vendor}</TableCell>
              <TableCell>{customer.email || "-"}</TableCell>
              <TableCell>{customer.phone || "-"}</TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 600 }}>Count: {lineItems.length}</Typography>
                {lineItems.slice(0, 3).map((item, idx) => (
                  <Typography key={`${invoice.id}-item-${idx}`} sx={{ fontSize: 13 }}>
                    {item.name} ({item.quantity} x {formatCurrency(item.unitPrice)})
                  </Typography>
                ))}
                {lineItems.length > 3 && (
                  <Typography sx={{ fontSize: 12, color: "#666" }}>
                    +{lineItems.length - 3} more items
                  </Typography>
                )}
              </TableCell>
              <TableCell>{formatCurrency(invoice.subtotal || invoice.amount)}</TableCell>
              <TableCell>{formatCurrency(invoice.taxTotal)}</TableCell>
              <TableCell>{formatCurrency(invoice.discount)}</TableCell>
              <TableCell>{formatCurrency(invoice.totalAmount || invoice.amount)}</TableCell>
              <TableCell>{invoice.date}</TableCell>
              <TableCell>{invoice.action}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => removeInvoice(invoice.id)}
                  >
                    Mark Done
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </StyledTable>
  );
}

export default Invoices;