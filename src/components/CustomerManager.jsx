import styled from "@emotion/styled";
import {
  Alert,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { getCustomerInvoices, getInvoiceDate, getInvoiceDueDate, getInvoicePaid, getInvoiceStatus, getInvoiceTotal, getLatestInvoice, getInvoiceBalance } from "../utils/invoiceData";
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
  gridTemplateColumns: "1fr",
  gap: 12,
  marginBottom: 12,
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

const INVOICE_TABS = [
  { value: "all", label: "All", badge: "#7c3aed" },
  { value: "draft", label: "Draft", badge: "#2563eb" },
  { value: "paid", label: "Paid", badge: "#16a34a" },
  { value: "overdue", label: "Overdue", badge: "#dc2626" },
  { value: "partial", label: "Partial", badge: "#d97706" },
];

const normalizeTabStatus = (status) => {
  const value = String(status || "").trim().toLowerCase();
  if (value === "paid") return "paid";
  if (value === "draft") return "draft";
  if (value === "overdue") return "overdue";
  if (value === "partial") return "partial";
  return null;
};

function CustomerManager({
  customers,
  invoices,
  onCustomersChanged,
  onInvoicesChanged,
  onCreateInvoiceForCustomer,
  showToast,
}) {
  const [form, setForm] = useState(EmptyCustomer);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedInvoiceTab, setSelectedInvoiceTab] = useState("all");

  const sortedCustomers = useMemo(() => {
    const safeCustomers = Array.isArray(customers) ? customers : [];
    return [...safeCustomers].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [customers]);

  const tabCounts = useMemo(() => {
    const counts = { all: 0, draft: 0, paid: 0, overdue: 0, partial: 0 };

    sortedCustomers.forEach((customer) => {
      counts.all += 1;

      const latest = getLatestInvoice(customer, invoices);
      if (!latest) return;

      const latestStatus = normalizeTabStatus(getInvoiceStatus(latest));
      if (latestStatus && counts[latestStatus] !== undefined) {
        counts[latestStatus] += 1;
      }
    });

    return counts;
  }, [sortedCustomers, invoices]);

  const filteredCustomers = useMemo(() => {
    const q = searchValue.trim().toLowerCase();

    let result = sortedCustomers.map((customer) => {
      const latestInvoice = getLatestInvoice(customer, invoices);
      return {
        customer,
        latestInvoice,
        latestStatus: latestInvoice ? normalizeTabStatus(getInvoiceStatus(latestInvoice)) : null,
        invoiceCount: getCustomerInvoices(customer, invoices).length,
      };
    });

    if (selectedInvoiceTab !== "all") {
      result = result.filter(({ latestStatus }) => latestStatus === selectedInvoiceTab);
    }

    if (q) {
      result = result.filter(({ customer }) =>
        (customer.name || "").toLowerCase().includes(q) ||
        (customer.email || "").toLowerCase().includes(q) ||
        (customer.customerRef || customer.referenceCode || "").toLowerCase().includes(q) ||
        (customer.phone || "").includes(q)
      );
    }

    return result;
  }, [sortedCustomers, selectedInvoiceTab, searchValue, invoices]);

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
      const message = editingId ? "Customer updated successfully." : "Customer added successfully.";
      setSuccessMessage(message);
      if (typeof showToast === "function") {
        showToast(message);
      }
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
      const message = "Customer deleted successfully.";
      setSuccessMessage(message);
      if (typeof showToast === "function") {
        showToast(message);
      }
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
      const message = `Customer reference ${referenceCode} copied.`;
      setSuccessMessage(message);
      if (typeof showToast === "function") {
        showToast("Customer reference copied!");
      }
    } catch (error) {
      setErrorMessage("Could not copy customer reference. Please copy manually.");
    }
  };

  return (
    <Wrapper>
      <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            overflowX: "auto",
            "&::-webkit-scrollbar": { height: 6 },
          }}
        >
          {INVOICE_TABS.map((tab) => {
            const isActive = selectedInvoiceTab === tab.value;
            return (
              <Box
                key={tab.value}
                onClick={() => setSelectedInvoiceTab(tab.value)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 1,
                  cursor: "pointer",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  borderBottom: isActive ? "2px solid #7c3aed" : "2px solid transparent",
                  color: isActive ? "#7c3aed" : "#6b7280",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.2s ease",
                }}
              >
                <Typography sx={{ fontSize: 14, color: "inherit", fontWeight: "inherit" }}>{tab.label}</Typography>
                <Box
                  sx={{
                    minWidth: 20,
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 10,
                    fontSize: 12,
                    lineHeight: 1.4,
                    textAlign: "center",
                    color: "#fff",
                    backgroundColor: tab.badge,
                  }}
                >
                  {tabCounts[tab.value]}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Customer Management</Typography>
      <Typography sx={{ color: "#666", mt: 0.5 }}>
        Customer-first workflow: maintain customer data and manage linked invoices.
      </Typography>

      <FormRow>
        <TextField name="name" label="Name" value={form.name} onChange={onChange} variant="outlined" size="small" />
        <TextField name="email" label="Email" value={form.email} onChange={onChange} variant="outlined" size="small" />
        <TextField name="phone" label="Phone" value={form.phone} onChange={onChange} variant="outlined" size="small" />
        <TextField name="address" label="Address" value={form.address} onChange={onChange} variant="outlined" size="small" />
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
          placeholder="Customer ref, name, email, phone"
          size="small"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
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
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(({ customer, latestInvoice, invoiceCount }, index) => {
              const isSelected = activeCustomerData?.customer?.id === customer.id;
              const invoiceStatus = latestInvoice
                ? normalizeTabStatus(getInvoiceStatus(latestInvoice)) || normalizeInvoiceStatus(deriveInvoiceStatus(latestInvoice))
                : null;
              const normalizedStatus = normalizeInvoiceStatus(invoiceStatus);
              const total = Number(getInvoiceTotal(latestInvoice) || 0);
              const paid = Number(getInvoicePaid(latestInvoice) || 0);
              const balance = Number(getInvoiceBalance(latestInvoice) || Math.max(0, total - paid));
              const isOverdue = invoiceStatus === "overdue";
              const baseBackground = isOverdue ? "#fff4f3" : index % 2 === 0 ? "#fff" : "#fafafa";

              return (
                <TableRow
                  key={customer.id}
                  hover
                  selected={isSelected}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  style={{ backgroundColor: baseBackground }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = "#faf5ff";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = baseBackground;
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 600 }}>{customer.referenceCode || customer.customerRef || "Generating..."}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={!(customer.referenceCode || customer.customerRef)}
                        onClick={(event) => {
                          event.stopPropagation();
                          copyCustomerReference(customer.referenceCode || customer.customerRef);
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
                  <TableCell>{latestInvoice ? getInvoiceDate(latestInvoice) || "-" : "No Invoice"}</TableCell>
                  <TableCell>{latestInvoice ? getInvoiceDueDate(latestInvoice) || "-" : "-"}</TableCell>
                  <TableCell>
                    {latestInvoice ? (
                      <Chip
                        size="small"
                        color={invoiceStatus === "partial" ? "warning" : statusColor(normalizedStatus)}
                        label={toTitleCase(invoiceStatus)}
                      />
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
            })
          ) : (
            <TableRow>
              <TableCell colSpan={14} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
                <div style={{ fontSize: "15px", fontWeight: "500", color: "#6b7280", marginBottom: "4px" }}>
                  No customers found
                </div>
                <div style={{ fontSize: "13px" }}>Try a different search or filter</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </StyledTable>

      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
      />
    </Wrapper>
  );
}

export default CustomerManager;