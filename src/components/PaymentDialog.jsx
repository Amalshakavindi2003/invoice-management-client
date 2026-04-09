import styled from "@emotion/styled";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

const Wrapper = styled(Box)(() => ({
  display: "grid",
  gap: 12,
  marginTop: 6,
}));

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "Online"];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function PaymentDialog({ open, invoice, onClose, onSubmit }) {
  const [form, setForm] = useState({
    amount: "",
    paidDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "Bank Transfer",
    paymentReference: "",
    paymentNotes: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = Number(invoice?.totalAmount || invoice?.amount || 0);
  const paid = Number(invoice?.paidAmount || 0);
  const remaining = Math.max(0, total - paid);

  useEffect(() => {
    if (open) {
      setForm({
        amount: remaining > 0 ? remaining.toFixed(2) : "",
        paidDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "Bank Transfer",
        paymentReference: "",
        paymentNotes: "",
      });
      setErrorMessage("");
      setSubmitting(false);
    }
  }, [open, remaining]);

  const onValueChange = (event) => {
    setErrorMessage("");
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const submit = async () => {
    const amount = toNumber(form.amount);

    if (amount <= 0) {
      setErrorMessage("Payment amount must be greater than 0.");
      return;
    }

    if (amount - remaining > 0.000001) {
      setErrorMessage("Payment amount cannot exceed remaining balance.");
      return;
    }

    if (!form.paidDate) {
      setErrorMessage("Paid date is required.");
      return;
    }

    if (!form.paymentMethod.trim()) {
      setErrorMessage("Payment method is required.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        amount,
        paidDate: form.paidDate,
        paymentMethod: form.paymentMethod.trim(),
        paymentReference: form.paymentReference.trim(),
        paymentNotes: form.paymentNotes.trim(),
      });
      onClose();
    } catch (error) {
      setErrorMessage(error.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      remaining: remaining.toFixed(2),
    };
  }, [total, paid, remaining]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent dividers>
        <Wrapper>
          <Typography>Total: Rs {summary.total}</Typography>
          <Typography>Already Paid: Rs {summary.paid}</Typography>
          <Typography sx={{ fontWeight: 700 }}>Remaining: Rs {summary.remaining}</Typography>

          <TextField
            name="amount"
            label="Amount Paid"
            type="number"
            value={form.amount}
            onChange={onValueChange}
            inputProps={{ min: 0, step: "0.01" }}
            size="small"
          />

          <TextField
            name="paidDate"
            label="Paid Date"
            type="date"
            value={form.paidDate}
            onChange={onValueChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            select
            name="paymentMethod"
            label="Payment Method"
            value={form.paymentMethod}
            onChange={onValueChange}
            size="small"
          >
            {PAYMENT_METHODS.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            name="paymentReference"
            label="Reference (optional)"
            value={form.paymentReference}
            onChange={onValueChange}
            size="small"
          />

          <TextField
            name="paymentNotes"
            label="Notes (optional)"
            value={form.paymentNotes}
            onChange={onValueChange}
            size="small"
            multiline
            minRows={2}
          />

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Wrapper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} variant="contained" disabled={submitting}>
          {submitting ? "Saving..." : "Save Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentDialog;