import styled from "@emotion/styled";
import {
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

const EmptyCustomer = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

function CustomerManager({ customers, onCustomersChanged }) {
  const [form, setForm] = useState(EmptyCustomer);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

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
      await onCustomersChanged();
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
        Create and manage customers. Every invoice is linked to one customer.
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
        <Typography color="error" sx={{ mb: 1 }}>
          {errorMessage}
        </Typography>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCustomers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.address}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="outlined" onClick={() => startEdit(customer)}>
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => deleteCustomerById(customer.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!sortedCustomers.length && (
        <Typography sx={{ mt: 1.5, color: "#666" }}>No customers added yet.</Typography>
      )}
    </Wrapper>
  );
}

export default CustomerManager;