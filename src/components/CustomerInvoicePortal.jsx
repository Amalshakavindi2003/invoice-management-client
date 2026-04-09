import styled from "@emotion/styled";
import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { getAllCustomers, getAllInvoice } from "../Services/api";
import InvoiceDetailsDialog from "./InvoiceDetailsDialog";

const Wrapper = styled(Box)(() => ({
  margin: 20,
}));

const SearchCard = styled(Paper)(() => ({
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  marginTop: 16,
}));

const SearchRow = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "2fr 1fr auto",
  gap: 12,
  alignItems: "end",
  marginTop: 8,
  "@media (max-width: 900px)": {
    gridTemplateColumns: "1fr",
  },
}));

const StyledTable = styled(Table)(() => ({
  marginTop: 12,
  "& > thead > tr > th": {
    background: "#9C27B0",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 600,
  },
  "& > tbody > tr > td": {
    fontSize: 14,
    verticalAlign: "top",
  },
}));

const formatCurrency = (value) => `Rs ${(Number(value) || 0).toFixed(2)}`;

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
      const [customersRes, invoicesRes] = await Promise.all([getAllCustomers(), getAllInvoice()]);
      const customers = Array.isArray(customersRes?.data) ? customersRes.data : [];
      const allInvoices = Array.isArray(invoicesRes?.data) ? invoicesRes.data : [];

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

  return (
    <Wrapper>
      <Typography sx={{ fontSize: 24, fontWeight: 700 }}>My Invoice Details</Typography>
      <Typography sx={{ color: "#666", mt: 0.5 }}>
        Secure customer view to check invoices using your customer reference.
      </Typography>

      <SearchCard elevation={0}>
        <Typography sx={{ fontWeight: 600 }}>Find your invoices</Typography>
        <Typography sx={{ color: "#666", fontSize: 13, mt: 0.5 }}>
          You can get your customer reference from the admin/customer support team or from a previous invoice.
        </Typography>

        <SearchRow>
          <TextField
            label="Customer Reference"
            placeholder="CUS-000001"
            value={customerReference}
            onChange={(event) => setCustomerReference(event.target.value)}
            size="small"
          />
          <TextField
            label="Last 4 digits of phone (optional)"
            placeholder="1403"
            value={phoneLast4}
            onChange={(event) => setPhoneLast4(event.target.value)}
            size="small"
            inputProps={{ maxLength: 4 }}
          />
          <Button variant="contained" onClick={findMyInvoices} disabled={loading}>
            {loading ? "Searching..." : "View My Invoices"}
          </Button>
        </SearchRow>

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
      </SearchCard>

      {customer && (
        <Paper sx={{ p: 2, mt: 2, border: "1px solid #e5e7eb" }} elevation={0}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Customer Profile</Typography>
          <Typography>Customer Ref: {customer.referenceCode || "-"}</Typography>
          <Typography>Name: {customer.name}</Typography>
          <Typography>Email: {customer.email}</Typography>
          <Typography>Phone: {customer.phone}</Typography>
          <Typography>Address: {customer.address}</Typography>

          <Typography sx={{ fontWeight: 700, mt: 2 }}>Invoices</Typography>
          {!sortedInvoices.length && (
            <Typography sx={{ color: "#666", mt: 0.5 }}>No invoices available.</Typography>
          )}

          {!!sortedInvoices.length && (
            <StyledTable size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>{invoice.date || "-"}</TableCell>
                    <TableCell>{invoice.action || "pending"}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount || invoice.amount)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </StyledTable>
          )}
        </Paper>
      )}

      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
      />
    </Wrapper>
  );
}

export default CustomerInvoicePortal;