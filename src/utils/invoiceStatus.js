export const VALID_INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];

export const toTitleCase = (value) => {
  if (!value) {
    return "Draft";
  }

  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

export const normalizeInvoiceStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) {
    return "draft";
  }

  if (normalized === "pending") {
    return "sent";
  }

  return VALID_INVOICE_STATUSES.includes(normalized) ? normalized : "draft";
};

export const isPastDue = (dueDate) => {
  if (!dueDate) {
    return false;
  }

  const parsed = Date.parse(dueDate);
  if (Number.isNaN(parsed)) {
    return false;
  }

  const due = new Date(parsed);
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today;
};

export const deriveInvoiceStatus = (invoice) => {
  const status = normalizeInvoiceStatus(invoice?.action);
  const total = Number(invoice?.totalAmount || invoice?.amount || 0);
  const paid = Number(invoice?.paidAmount || 0);

  if (total > 0 && paid + 0.000001 >= total) {
    return "paid";
  }

  if (status === "sent" && isPastDue(invoice?.dueDate)) {
    return "overdue";
  }

  return status;
};

export const canSendReminder = (status) => {
  const normalized = normalizeInvoiceStatus(status);
  return normalized !== "paid" && normalized !== "cancelled";
};

export const statusColor = (status) => {
  const normalized = normalizeInvoiceStatus(status);
  if (normalized === "paid") {
    return "success";
  }
  if (normalized === "overdue") {
    return "error";
  }
  if (normalized === "cancelled") {
    return "default";
  }
  if (normalized === "sent") {
    return "warning";
  }
  return "info";
};