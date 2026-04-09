import styled from "@emotion/styled";
import {
  Alert,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { removeCustomer, saveCustomer, updateCustomer } from "../Services/api";
import InvoiceDetailsDialog from "./InvoiceDetailsDialog";

const Wrapper = styled(Box)(() => ({
  marginTop: 20,
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
}));

const FormRow = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr)) auto",
  gap: 12,
  marginTop: 10,
  marginBottom: 12,
  "@media (max-width: 1100px)": {
    gridTemplateColumns: "1fr",
  },
}));

const StyledTable = styled(Table)(() => ({
  marginTop: 16,
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

const EmptyCustomer = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

const formatCurrency = (value) => `Rs ${(Number(value) || 0).toFixed(2)}`;

function CustomerManager({
  customers,
  invoices,
  onCustomersChanged,
  onInvoicesChanged,
  onMarkInvoiceDone,
}) {
  const [form, setForm] = useState(EmptyCustomer);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const invoiceMap = useMemo(() => {
    const map = new Map();
    const customerByName = new Map();

    (Array.isArray(customers) ? customers : []).forEach((customer) => {
      if (customer?.name) {
        customerByName.set(customer.name.trim().toLowerCase(), customer.id);
      }
    });

    const resolveCustomerKey = (invoice) => {
      const nestedId = invoice?.customer?.id;
      if (nestedId !== undefined && nestedId !== null && nestedId !== "") {
        return String(nestedId);
      }

      const rootCustomerId = invoice?.customerId;
      if (rootCustomerId !== undefined && rootCustomerId !== null && rootCustomerId !== "") {
        return String(rootCustomerId);
      }

      const vendorName =
        typeof invoice?.vendor === "string" ? invoice.vendor.trim().toLowerCase() : "";
      if (vendorName && customerByName.has(vendorName)) {
        return String(customerByName.get(vendorName));
      }

      return null;
    };

    (Array.isArray(invoices) ? invoices : []).forEach((invoice) => {
      const customerKey = resolveCustomerKey(invoice);
      if (!customerKey) {
        return;
      }

      const existing = map.get(customerKey) || [];
      existing.push(invoice);
      map.set(customerKey, existing);
    });

    map.forEach((customerInvoices, key) => {
      customerInvoices.sort((a, b) => {
        const dateA = Date.parse(a.date || "") || 0;
        const dateB = Date.parse(b.date || "") || 0;
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        return (b.id || 0) - (a.id || 0);
      });
      map.set(key, customerInvoices);
    });

    return map;
  }, [customers, invoices]);

  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name)),
    [customers]
  );

  const onChange = (event) => {
    setErrorMessage("");
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const resetForm = () => {
    setForm(EmptyCustomer);
    setEditingId(null);
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setErrorMessage("All customer fields are required.");
      return false;
    }
    return true;
  };

  const submitCustomer = async () => {
    try {
      if (!validate()) {
        return;
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      if (editingId) {
        await updateCustomer(editingId, payload);
      } else {
        await saveCustomer(payload);
      }

      await onCustomersChanged();
      resetForm();
    } catch (error) {
      setErrorMessage(error.message || "Customer operation failed.");
    }
  };

  const startEdit = (customer) => {
    setErrorMessage("");
    setEditingId(customer.id);
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
  };

  const deleteCustomerById = async (id) => {
    try {
      await removeCustomer(id);
      await Promise.all([
        onCustomersChanged(),
        typeof onInvoicesChanged === "function" ? onInvoicesChanged() : Promise.resolve(),
      ]);
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to delete customer.");
    }
  };

  return (
    <Wrapper>
      <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Customer Management</Typography>
      <Typography sx={{ color: "#666", mt: 0.5 }}>
        Single table view: customer data with invoice status and details.
      </Typography>

      <FormRow>
        <TextField
          name="name"
          label="Name"
          value={form.name}
          onChange={onChange}
          variant="outlined"
          size="small"
        />
        <TextField
          name="email"
          label="Email"
          value={form.email}
          onChange={onChange}
          variant="outlined"
          size="small"
        />
        <TextField
          name="phone"
          label="Phone"
          value={form.phone}
          onChange={onChange}
          variant="outlined"
          size="small"
        />
        <TextField
          name="address"
          label="Address"
          value={form.address}
          onChange={onChange}
          variant="outlined"
          size="small"
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={submitCustomer}>
            {editingId ? "Update" : "Add"}
          </Button>
          {editingId && (
            <Button variant="outlined" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </Box>
      </FormRow>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {errorMessage}
        </Alert>
      )}

      <StyledTable size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Invoices</TableCell>
            <TableCell>Latest Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Invoice Action</TableCell>
            <TableCell>Customer Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCustomers.map((customer) => {
            const customerInvoices = invoiceMap.get(String(customer.id)) || [];
            const latestInvoice = customerInvoices[0] || null;

            return (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.address}</TableCell>
                <TableCell>{customerInvoices.length}</TableCell>
                <TableCell>{latestInvoice?.date || "No Invoice"}</TableCell>
                <TableCell>{latestInvoice?.action || "No Invoice"}</TableCell>
                <TableCell>
                  {latestInvoice
                    ? formatCurrency(latestInvoice.totalAmount || latestInvoice.amount)
                    : "No Invoice"}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!latestInvoice}
                      onClick={() => setSelectedInvoice(latestInvoice)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="success"
                      disabled={!latestInvoice}
                      onClick={() => latestInvoice && onMarkInvoiceDone(latestInvoice.id)}
                    >
                      Mark Done
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="outlined" size="small" onClick={() => startEdit(customer)}>
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => deleteCustomerById(customer.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </StyledTable>

      {!sortedCustomers.length && (
        <Typography sx={{ mt: 1.5, color: "#666" }}>No customers added yet.</Typography>
      )}

      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
      />
    </Wrapper>
  );
}

export default CustomerManager;