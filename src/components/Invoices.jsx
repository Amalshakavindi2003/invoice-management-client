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
import { useMemo, useState } from "react";
import InvoiceDetailsDialog from "./InvoiceDetailsDialog";

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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId]
  );

  if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
    return <Typography sx={{ marginTop: 3 }}>No Pending invoices</Typography>;
  }

  return (
    <>
      <StyledTable>
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => {
            const customer = invoice.customer || {};

            return (
              <TableRow key={invoice.id}>
                <TableCell>{customer.name || invoice.vendor}</TableCell>
                <TableCell>{invoice.date || "-"}</TableCell>
                <TableCell>{invoice.action || "pending"}</TableCell>
                <TableCell>{formatCurrency(invoice.totalAmount || invoice.amount)}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="outlined" onClick={() => setSelectedInvoiceId(invoice.id)}>
                      View
                    </Button>
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

      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </>
  );
}

export default Invoices;