import jsPDF from "jspdf";

const toNumber = (value) => Number(value || 0);
const formatMoney = (value) => `Rs ${toNumber(value).toLocaleString("en-IN")}`;

const toDisplayStatus = (invoice) => {
  const raw = String(invoice?.status || invoice?.action || "").trim().toLowerCase();
  if (raw === "paid") return "Paid";
  if (raw === "partial") return "Partial";
  if (raw === "overdue") return "Overdue";
  if (raw === "draft") return "Draft";

  const total = toNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);
  const paid = toNumber(invoice?.paid ?? invoice?.paidAmount);

  if (total > 0 && paid + 0.000001 >= total) return "Paid";
  if (paid > 0 && paid < total) return "Partial";
  return "Draft";
};

export function generateInvoicePDF(invoice, customer = {}) {
  if (!invoice) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const total = toNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);
  const paid = toNumber(invoice?.paid ?? invoice?.paidAmount);
  const balance = toNumber(invoice?.balance ?? Math.max(0, total - paid));
  const dateText = invoice?.date || "-";
  const dueText = invoice?.dueDate || "-";
  const statusText = toDisplayStatus(invoice);
  const customerName = customer?.name || invoice?.customer?.name || invoice?.vendor || "Customer";
  const customerRef = customer?.customerRef || customer?.referenceCode || invoice?.customer?.referenceCode || "-";

  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EasyInvoice", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Invoice Document", pageWidth - 14, 18, { align: "right" });

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice #${invoice?.id ?? "-"}`, pageWidth - 14, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${dateText}`, pageWidth - 14, 50, { align: "right" });
  doc.text(`Due: ${dueText}`, pageWidth - 14, 57, { align: "right" });

  const statusColors = {
    Paid: [22, 163, 74],
    Draft: [37, 99, 235],
    Overdue: [220, 38, 38],
    Partial: [217, 119, 6],
  };
  const sc = statusColors[statusText] || [100, 100, 100];
  doc.setTextColor(sc[0], sc[1], sc[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Status: ${statusText}`, pageWidth - 14, 65, { align: "right" });

  doc.setTextColor(109, 40, 217);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 14, 42);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(customerName, 14, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(customer?.email || invoice?.customer?.email || "-", 14, 57);
  doc.text(customer?.phone || invoice?.customer?.phone || "-", 14, 63);
  doc.text(customer?.address || invoice?.customer?.address || "-", 14, 69);
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`Ref: ${customerRef}`, 14, 75);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, 80, pageWidth - 14, 80);

  const tableTop = 88;
  doc.setFillColor(245, 243, 255);
  doc.rect(14, tableTop - 6, pageWidth - 28, 10, "F");
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 18, tableTop);
  doc.text("Qty", 110, tableTop, { align: "right" });
  doc.text("Unit Price", 140, tableTop, { align: "right" });
  doc.text("Amount", pageWidth - 18, tableTop, { align: "right" });

  let y = tableTop + 12;
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const items = Array.isArray(invoice?.items)
    ? invoice.items
    : Array.isArray(invoice?.lineItems)
      ? invoice.lineItems
      : [];

  items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 252);
      doc.rect(14, y - 5, pageWidth - 28, 9, "F");
    }

    const quantity = toNumber(item?.quantity);
    const unitPrice = toNumber(item?.unitPrice);
    const taxRate = toNumber(item?.taxRate);
    const computedAmount = quantity * unitPrice + ((quantity * unitPrice * taxRate) / 100);
    const amount = toNumber(item?.amount ?? item?.total ?? computedAmount);
    const description = item?.description || item?.name || "";

    doc.text(String(description), 18, y);
    doc.text(String(quantity || ""), 110, y, { align: "right" });
    doc.text(formatMoney(unitPrice), 140, y, { align: "right" });
    doc.text(formatMoney(amount), pageWidth - 18, y, { align: "right" });
    y += 10;
  });

  if (items.length === 0) {
    doc.text("Invoice Total", 18, y);
    doc.text(formatMoney(total), pageWidth - 18, y, { align: "right" });
    y += 10;
  }

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 80, y, pageWidth - 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text("Total:", pageWidth - 55, y);
  doc.text(formatMoney(total), pageWidth - 18, y, { align: "right" });
  y += 8;

  doc.text("Paid:", pageWidth - 55, y);
  doc.setTextColor(22, 163, 74);
  doc.text(formatMoney(paid), pageWidth - 18, y, { align: "right" });
  y += 8;

  doc.setTextColor(220, 38, 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Balance Due:", pageWidth - 55, y);
  doc.text(formatMoney(balance), pageWidth - 18, y, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 270, pageWidth - 14, 270);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", pageWidth / 2, 276, { align: "center" });
  doc.text("EasyInvoice | Generated automatically", pageWidth / 2, 281, { align: "center" });

  const safeCustomer = String(customerName).replace(/\s+/g, "_");
  doc.save(`Invoice-${invoice?.id ?? "NA"}-${safeCustomer}.pdf`);
}