import styled from "@emotion/styled";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
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
import {
  deriveInvoiceStatus,
  normalizeInvoiceStatus,
  statusColor,
  toTitleCase,
} from "../utils/invoiceStatus";
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

const ControlsRow = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 12,
  marginBottom: 12,
  "@media (max-width: 900px)": {
    gridTemplateColumns: "1fr",
  },
}));

const StyledTable = styled(Table)(() => ({
  marginTop: 8,
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

const statusLabels = {
  all: "All Customers",
  withInvoices: "With Invoices",
  noInvoices: "No Invoices",
  open: "Open Invoices",
};

function CustomerManager({
  customers,
  invoices,
  onCustomersChanged,
  onInvoicesChanged,
  onCreateInvoiceForCustomer,
}) {
  const [form, setForm] = useState(EmptyCustomer);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const invoiceMap = useMemo(() => {
    const map = new Map();

    (Array.isArray(invoices) ? invoices : []).forEach((invoice) => {
      const nestedId = invoice?.customer?.id;
      if (nestedId === undefined || nestedId === null) {
        return;
      }

      const key = String(nestedId);
      const existing = map.get(key) || [];
      existing.push(invoice);
      map.set(key, existing);
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
  }, [invoices]);

  const sortedCustomers = useMemo(() => {
    const safeCustomers = Array.isArray(customers) ? customers : [];
    return [...safeCustomers].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [customers]);

  const enrichedCustomers = useMemo(() => {
    return sortedCustomers.map((customer) => {
      const customerInvoices = invoiceMap.get(String(customer.id)) || [];
      const latestInvoice = customerInvoices[0] || null;
      const hasOpen = customerInvoices.some((invoice) => {
        const status = normalizeInvoiceStatus(deriveInvoiceStatus(invoice));
        return status === "draft" || status === "sent" || status === "overdue";
      });

      return {
        customer,
        latestInvoice,
        invoiceCount: customerInvoices.length,
        hasOpen,
      };
    });
  }, [sortedCustomers, invoiceMap]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return enrichedCustomers.filter(({ customer, invoiceCount, hasOpen }) => {
      const text = [
        customer.referenceCode,
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || text.includes(normalizedSearch);
      if (!matchesSearch) {
        return false;
      }

      if (statusFilter === "withInvoices") {
        return invoiceCount > 0;
      }

      if (statusFilter === "noInvoices") {
        return invoiceCount === 0;
      }

      if (statusFilter === "open") {
        return hasOpen;
      }

      return true;
    });
  }, [enrichedCustomers, searchValue, statusFilter]);

  const activeCustomerData = useMemo(() => {
    const activeId = selectedCustomerId || filteredCustomers[0]?.customer?.id;
    return filteredCustomers.find(({ customer }) => customer.id === activeId) || null;
  }, [filteredCustomers, selectedCustomerId]);

  const onChange = (event) => {
    setErrorMessage("");
    setSuccessMessage("");
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

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }

    if (!/^[0-9+\-()\s]{7,20}$/.test(form.phone.trim())) {
      setErrorMessage("Please enter a valid phone number.");
      return false;
    }

    return true;
  };

  const submitCustomer = async () => {
    try {
      if (!validate()) {
        return;
      }

      setSuccessMessage("");
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
      setSuccessMessage(editingId ? "Customer updated successfully." : "Customer added successfully.");
    } catch (error) {
      setErrorMessage(error.message || "Customer operation failed.");
    }
  };

  const startEdit = (customer) => {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingId(customer.id);
    setSelectedCustomerId(customer.id);
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
  };

  const deleteCustomerById = async (id) => {
    try {
      setSuccessMessage("");
      await removeCustomer(id);
      await Promise.all([
        onCustomersChanged(),
        typeof onInvoicesChanged === "function" ? onInvoicesChanged() : Promise.resolve(),
      ]);
      if (editingId === id) {
        resetForm();
      }
      if (selectedCustomerId === id) {
        setSelectedCustomerId(null);
      }
      setSuccessMessage("Customer deleted successfully.");
    } catch (error) {
      setErrorMessage(error.message || "Unable to delete customer.");
    }
  };

  const copyCustomerReference = async (referenceCode) => {
    if (!referenceCode) {
      setErrorMessage("Customer reference is not ready yet. Refresh and try again.");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(referenceCode));
      }
      setErrorMessage("");
      setSuccessMessage(`Customer reference ${referenceCode} copied.`);
    } catch (error) {
      setErrorMessage("Could not copy customer reference. Please copy manually.");
    }
  };

  return (
    <Wrapper>
      <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Customer Management</Typography>
      <Typography sx={{ color: "#666", mt: 0.5 }}>
        Customer-first workflow: maintain customer data and manage linked invoices.
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

      <ControlsRow>
        <TextField
          label="Search customers"
          placeholder="Customer ref, name, email, phone, address"
          size="small"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <TextField
          select
          label="Filter"
          size="small"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </ControlsRow>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {errorMessage}
        </Alert>
      )}
      {!errorMessage && successMessage && (
        <Alert severity="success" sx={{ mb: 1 }}>
          {successMessage}
        </Alert>
      )}

      <StyledTable size="small">
        <TableHead>
          <TableRow>
            <TableCell>Customer Ref</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Invoices</TableCell>
            <TableCell>Latest Date</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Paid</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell>Invoice Action</TableCell>
            <TableCell>Customer Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredCustomers.map(({ customer, latestInvoice, invoiceCount }) => {
            const isSelected = activeCustomerData?.customer?.id === customer.id;
            const invoiceStatus = latestInvoice ? deriveInvoiceStatus(latestInvoice) : null;
            const normalizedStatus = normalizeInvoiceStatus(invoiceStatus);
            const total = Number(latestInvoice?.totalAmount || latestInvoice?.amount || 0);
            const paid = Number(latestInvoice?.paidAmount || 0);
            const balance = Math.max(0, total - paid);
            const isOverdue = normalizedStatus === "overdue";

            return (
              <TableRow
                key={customer.id}
                hover
                selected={isSelected}
                onClick={() => setSelectedCustomerId(customer.id)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: isOverdue ? "#fff4f3" : undefined,
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 600 }}>{customer.referenceCode || "Generating..."}</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!customer.referenceCode}
                      onClick={(event) => {
                        event.stopPropagation();
                        copyCustomerReference(customer.referenceCode);
                      }}
                    >
                      Copy Ref
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.address}</TableCell>
                <TableCell>{invoiceCount}</TableCell>
                <TableCell>{latestInvoice?.date || "No Invoice"}</TableCell>
                <TableCell>{latestInvoice?.dueDate || "-"}</TableCell>
                <TableCell>
                  {latestInvoice ? (
                    <Chip size="small" color={statusColor(normalizedStatus)} label={toTitleCase(normalizedStatus)} />
                  ) : (
                    "No Invoice"
                  )}
                </TableCell>
                <TableCell>{latestInvoice ? formatCurrency(total) : "No Invoice"}</TableCell>
                <TableCell>{latestInvoice ? formatCurrency(paid) : "No Invoice"}</TableCell>
                <TableCell>
                  {latestInvoice ? (
                    <Typography sx={{ color: balance > 0 ? "#b45309" : "#15803d", fontWeight: 600 }}>
                      {formatCurrency(balance)}
                    </Typography>
                  ) : (
                    "No Invoice"
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!latestInvoice}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedInvoice(latestInvoice);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (typeof onCreateInvoiceForCustomer === "function") {
                          onCreateInvoiceForCustomer(customer.id);
                        }
                      }}
                    >
                      Add Invoice
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEdit(customer);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      disabled={invoiceCount > 0}
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteCustomerById(customer.id);
                      }}
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

      {!filteredCustomers.length && (
        <Typography sx={{ mt: 1.5, color: "#666" }}>No customers match current filters.</Typography>
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