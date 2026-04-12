export const getCustomerKey = (customer) =>
  String(customer?.id ?? customer?.referenceCode ?? customer?.customerRef ?? "");

export const getCustomerReference = (customer) => customer?.referenceCode || customer?.customerRef || "";

export const getCustomerInvoices = (customer, invoices = []) => {
  const customerId = customer?.id == null ? "" : String(customer.id);
  const customerRef = String(getCustomerReference(customer)).trim().toUpperCase();

  return (Array.isArray(invoices) ? invoices : []).filter((invoice) => {
    const linkedCustomer = invoice?.customer || {};
    const linkedCustomerId = linkedCustomer?.id == null ? "" : String(linkedCustomer.id);
    const linkedCustomerRef = String(linkedCustomer?.referenceCode || linkedCustomer?.customerRef || "")
      .trim()
      .toUpperCase();

    return (
      (customerId && linkedCustomerId === customerId) ||
      (customerRef && linkedCustomerRef === customerRef)
    );
  });
};

export const getInvoiceDate = (invoice) => invoice?.date || invoice?.invoiceDate || invoice?.createdDate || invoice?.createdAt || "";

export const getInvoiceDueDate = (invoice) => invoice?.dueDate || invoice?.due_date || invoice?.dueOn || "";

export const getInvoiceStatus = (invoice) => String(invoice?.status || invoice?.action || "").trim();

export const getInvoiceTotal = (invoice) => Number(invoice?.totalAmount ?? invoice?.total ?? invoice?.amount ?? invoice?.invoiceTotal ?? 0);

export const getInvoicePaid = (invoice) => Number(invoice?.paidAmount ?? invoice?.paid ?? invoice?.amountPaid ?? 0);

export const getInvoiceBalance = (invoice) => {
  const total = getInvoiceTotal(invoice);
  const paid = getInvoicePaid(invoice);
  return Number(invoice?.balance ?? invoice?.remaining ?? invoice?.balanceDue ?? Math.max(0, total - paid));
};

export const getLatestInvoice = (customer, invoices = []) => {
  const customerInvoices = getCustomerInvoices(customer, invoices);
  if (customerInvoices.length === 0) {
    return null;
  }

  return [...customerInvoices].sort((a, b) => {
    const dateA = Date.parse(getInvoiceDate(a) || 0) || 0;
    const dateB = Date.parse(getInvoiceDate(b) || 0) || 0;
    if (dateA !== dateB) return dateB - dateA;
    return Number(b?.id || 0) - Number(a?.id || 0);
  })[0];
};