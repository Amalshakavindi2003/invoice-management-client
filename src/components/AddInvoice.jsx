import styled from "@emotion/styled";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import api from "../Services/api";
import { VALID_INVOICE_STATUSES, normalizeInvoiceStatus, toTitleCase } from "../utils/invoiceStatus";

const Component = styled(Box)(() => ({
  marginTop: 20,
  "& > p": {
    fontSize: 26,
    marginBottom: 16,
  },
}));

const FormRow = styled(Box)(() => ({
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 16,
  "& > div": {
    minWidth: 220,
  },
}));

const ItemRow = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
  gap: 12,
  alignItems: "center",
  marginBottom: 12,
  "@media (max-width: 900px)": {
    gridTemplateColumns: "1fr",
  },
}));

const TotalsCard = styled(Box)(() => ({
  marginTop: 16,
  padding: 12,
  width: "fit-content",
  minWidth: 320,
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  background: "#fafafa",
}));

const createLineItem = () => ({
  name: "",
  quantity: 1,
  unitPrice: 0,
  taxRate: 0,
});

const addDays = (dateValue, days) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const defaultObj = {
  customerId: "",
  date: "",
  dueDate: "",
  discount: 0,
  action: "draft",
  lineItems: [createLineItem()],
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function AddInvoice({ setAddInvoice, customers, onSaved, initialCustomerId = null }) {
  const [invoice, setInvoice] = useState(defaultObj);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialCustomerId) {
      setInvoice((prev) => ({ ...prev, customerId: String(initialCustomerId) }));
      return;
    }

    if (!invoice.customerId && Array.isArray(customers) && customers.length > 0) {
      setInvoice((prev) => ({ ...prev, customerId: String(customers[0].id) }));
    }
  }, [customers, invoice.customerId, initialCustomerId]);

  const calculation = useMemo(() => {
    const subtotal = invoice.lineItems.reduce((sum, item) => {
      const quantity = Math.max(0, toNumber(item.quantity));
      const unitPrice = Math.max(0, toNumber(item.unitPrice));
      return sum + quantity * unitPrice;
    }, 0);

    const tax = invoice.lineItems.reduce((sum, item) => {
      const quantity = Math.max(0, toNumber(item.quantity));
      const unitPrice = Math.max(0, toNumber(item.unitPrice));
      const taxRate = Math.max(0, toNumber(item.taxRate));
      return sum + quantity * unitPrice * (taxRate / 100);
    }, 0);

    const discount = Math.max(0, toNumber(invoice.discount));
    const total = Math.max(0, subtotal + tax - discount);

    return { subtotal, tax, discount, total };
  }, [invoice]);

  const selectedCustomer = customers.find(
    (customer) => Number(customer.id) === Number(invoice.customerId)
  );

  const onInvoiceValueChange = (event) => {
    const { name, value } = event.target;
    setErrorMessage("");

    setInvoice((prev) => {
      if (name === "date") {
        const nextDueDate = prev.dueDate || addDays(value, 14);
        return { ...prev, date: value, dueDate: nextDueDate };
      }

      return { ...prev, [name]: value };
    });
  };

  const onLineItemChange = (index, field, value) => {
    setInvoice((prev) => {
      const updatedItems = [...prev.lineItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
      return { ...prev, lineItems: updatedItems };
    });
  };

  const addLineItem = () => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, createLineItem()],
    }));
  };

  const removeLineItem = (index) => {
    setInvoice((prev) => {
      if (prev.lineItems.length === 1) {
        return prev;
      }

      const updatedItems = prev.lineItems.filter((_, itemIndex) => itemIndex !== index);
      return { ...prev, lineItems: updatedItems };
    });
  };

  const addNewInvoice = async () => {
    try {
      if (!invoice.customerId) {
        setErrorMessage("Please select a customer.");
        return;
      }

      if (!invoice.date) {
        setErrorMessage("Please select invoice date.");
        return;
      }

      if (!invoice.dueDate) {
        setErrorMessage("Please select due date.");
        return;
      }

      const invoiceDateMs = Date.parse(invoice.date);
      const dueDateMs = Date.parse(invoice.dueDate);
      if (Number.isNaN(invoiceDateMs) || Number.isNaN(dueDateMs)) {
        setErrorMessage("Invoice and due dates must be valid.");
        return;
      }

      const normalizedItems = invoice.lineItems.map((item) => ({
        name: item.name.trim(),
        quantity: Math.max(0, toNumber(item.quantity)),
        unitPrice: Math.max(0, toNumber(item.unitPrice)),
        taxRate: Math.max(0, toNumber(item.taxRate)),
      }));

      if (normalizedItems.some((item) => !item.name)) {
        setErrorMessage("Each line item must have a product/service name.");
        return;
      }

      if (normalizedItems.some((item) => item.quantity <= 0 || item.unitPrice <= 0)) {
        setErrorMessage("Quantity and Unit Price must be greater than 0 for all items.");
        return;
      }

      await api.addInvoice({
        customer: { id: Number(invoice.customerId) },
        vendor: selectedCustomer?.name || "",
        product: normalizedItems[0]?.name || "",
        amount: Math.round(calculation.total),
        date: invoice.date,
        dueDate: invoice.dueDate,
        action: normalizeInvoiceStatus(invoice.action),
        discount: calculation.discount,
        subtotal: calculation.subtotal,
        taxTotal: calculation.tax,
        totalAmount: calculation.total,
        lineItems: normalizedItems,
      });

      if (typeof onSaved === "function") {
        await onSaved();
      }
      setAddInvoice(false);
    } catch (error) {
      setErrorMessage(error.message || "Failed to save invoice.");
    }
  };

  if (!customers.length) {
    return (
      <Component>
        <Typography>Add Invoice</Typography>
        <Typography color="error">
          Add at least one customer before creating invoices.
        </Typography>
      </Component>
    );
  }

  return (
    <Component>
      <Typography>Add Invoice</Typography>

      {selectedCustomer && (
        <Typography sx={{ fontSize: 14, color: "#555", mt: -1, mb: 2 }}>
          Creating invoice for: {selectedCustomer.name} ({selectedCustomer.email})
        </Typography>
      )}

      <FormRow>
        <TextField
          select
          onChange={onInvoiceValueChange}
          value={invoice.customerId}
          variant="standard"
          name="customerId"
          label="Customer"
        >
          {customers.map((customer) => (
            <MenuItem key={customer.id} value={customer.id}>
              {customer.name} ({customer.email})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          onChange={onInvoiceValueChange}
          value={invoice.date}
          type="date"
          variant="standard"
          name="date"
          label="Invoice Date"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          onChange={onInvoiceValueChange}
          value={invoice.dueDate}
          type="date"
          variant="standard"
          name="dueDate"
          label="Due Date"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          select
          onChange={onInvoiceValueChange}
          value={invoice.action}
          variant="standard"
          name="action"
          label="Initial Status"
        >
          {VALID_INVOICE_STATUSES.filter((status) => status !== "overdue").map((status) => (
            <MenuItem key={status} value={status}>
              {toTitleCase(status)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          onChange={onInvoiceValueChange}
          value={invoice.discount}
          type="number"
          label="Discount"
          variant="standard"
          name="discount"
        />
      </FormRow>

      <Typography sx={{ fontSize: 18, marginBottom: 1 }}>Line Items</Typography>
      {invoice.lineItems.map((item, index) => (
        <ItemRow key={`line-item-${index}`}>
          <TextField
            value={item.name}
            onChange={(event) => onLineItemChange(index, "name", event.target.value)}
            variant="standard"
            placeholder="Product / Service"
          />
          <TextField
            value={item.quantity}
            onChange={(event) => onLineItemChange(index, "quantity", event.target.value)}
            variant="standard"
            type="number"
            placeholder="Qty"
          />
          <TextField
            value={item.unitPrice}
            onChange={(event) => onLineItemChange(index, "unitPrice", event.target.value)}
            variant="standard"
            type="number"
            placeholder="Unit Price"
          />
          <TextField
            value={item.taxRate}
            onChange={(event) => onLineItemChange(index, "taxRate", event.target.value)}
            variant="standard"
            type="number"
            placeholder="Tax %"
          />
          <Button variant="outlined" color="error" onClick={() => removeLineItem(index)}>
            Remove
          </Button>
        </ItemRow>
      ))}

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Button onClick={addLineItem} variant="outlined">
          Add Line Item
        </Button>
        <Button onClick={addNewInvoice} variant="contained">
          Save Invoice
        </Button>
      </Box>

      {errorMessage && (
        <Typography color="error" sx={{ mt: 1.5 }}>
          {errorMessage}
        </Typography>
      )}

      <TotalsCard>
        <Typography>Subtotal: Rs {calculation.subtotal.toFixed(2)}</Typography>
        <Typography>Tax: Rs {calculation.tax.toFixed(2)}</Typography>
        <Typography>Discount: Rs {calculation.discount.toFixed(2)}</Typography>
        <Typography sx={{ fontWeight: 700 }}>
          Total Amount: Rs {calculation.total.toFixed(2)}
        </Typography>
      </TotalsCard>
    </Component>
  );
}

export default AddInvoice;