import React, { useMemo } from "react";

const toNumber = (value) => Number(value || 0);

const toDisplayStatus = (invoice) => {
  const raw = String(invoice?.status || invoice?.action || "").trim().toLowerCase();
  if (raw === "paid") {
    return "Paid";
  }
  if (raw === "partial") {
    return "Partial";
  }
  if (raw === "overdue") {
    return "Overdue";
  }
  if (raw === "draft") {
    return "Draft";
  }

  const total = toNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);
  const paid = toNumber(invoice?.paid ?? invoice?.paidAmount);

  if (total > 0 && paid + 0.000001 >= total) {
    return "Paid";
  }
  if (paid > 0 && paid < total) {
    return "Partial";
  }

  return "Draft";
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function ActivityTimeline({ customers = [], invoices = [] }) {
  const events = useMemo(() => {
    const list = [];

    (Array.isArray(customers) ? customers : []).forEach((customer) => {
      const customerRef = customer.customerRef || customer.referenceCode || "-";

      list.push({
        id: `customer-${customer.customerRef || customer.referenceCode || customer.id || customer.name || "unknown"}`,
        type: "CustomerAdded",
        label: "Customer Added",
        date: customer.createdAt || new Date().toISOString(),
        customerName: customer.name,
        customerRef,
        amount: null,
        status: "Active",
        color: "#8b5cf6",
        dotBg: "#f5f3ff",
      });

      const customerInvoices = customer.invoiceList || customer.invoices || customer.allInvoices || [];

      customerInvoices.forEach((invoice) => {
        const status = toDisplayStatus(invoice);
        const date = invoice?.date || invoice?.invoiceDate || "";
        const dueDate = invoice?.dueDate || "";
        const total = toNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);
        const paid = toNumber(invoice?.paid ?? invoice?.paidAmount);
        const balance = toNumber(invoice?.balance ?? Math.max(0, total - paid));
        const due = parseDate(dueDate);
        if (due) {
          due.setHours(0, 0, 0, 0);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = Boolean(due && due < today && status !== "Paid");

        const customerName = customer?.name || invoice?.customer?.name || invoice?.vendor || "Unknown Customer";

        list.push({
          id: `created-${invoice?.id}`,
          type: "Created",
          label: "Invoice Created",
          date,
          customerName,
          customerRef,
          amount: total,
          status,
          color: "#6d28d9",
          dotBg: "#f5f3ff",
        });

        if (status === "Paid") {
          list.push({
            id: `paid-${invoice?.id}`,
            type: "Paid",
            label: "Payment Received",
            date,
            customerName,
            customerRef,
            amount: total,
            status: "Paid",
            color: "#10b981",
            dotBg: "#ecfdf5",
          });
        }

        if (isOverdue) {
          list.push({
            id: `overdue-${invoice?.id}`,
            type: "Overdue",
            label: "Invoice Overdue",
            date: dueDate,
            customerName,
            customerRef,
            amount: balance,
            status: "Overdue",
            color: "#ef4444",
            dotBg: "#fef2f2",
          });
        }

        if (status === "Draft") {
          list.push({
            id: `draft-${invoice?.id}`,
            type: "Draft",
            label: "Draft Invoice",
            date,
            customerName,
            customerRef,
            amount: total,
            status: "Draft",
            color: "#3b82f6",
            dotBg: "#dbeafe",
          });
        }
      });
    });

    if (list.length === 0 && Array.isArray(invoices)) {
      invoices.forEach((invoice) => {
        const status = toDisplayStatus(invoice);
        const date = invoice?.date || invoice?.invoiceDate || "";
        const total = toNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);

        list.push({
          id: `created-${invoice?.id}`,
          type: "Created",
          label: "Invoice Created",
          date,
          customerName: invoice?.customer?.name || "Unknown Customer",
          customerRef: invoice?.customer?.referenceCode || "-",
          amount: total,
          status,
          color: "#6d28d9",
          dotBg: "#f5f3ff",
        });
      });
    }

    return list.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return timeB - timeA;
    });
  }, [customers, invoices]);

  const statusColors = {
    Paid: { bg: "#dcfce7", color: "#166534" },
    Draft: { bg: "#dbeafe", color: "#1e40af" },
    Overdue: { bg: "#fee2e2", color: "#991b1b" },
    Partial: { bg: "#fef3c7", color: "#92400e" },
    Active: { bg: "#f5f3ff", color: "#6d28d9" },
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (events.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af", fontSize: "14px" }}>
        No activity yet. Add customers and invoices to see the timeline.
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "#1f2937" }}>Invoice Activity</h3>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "3px 0 0" }}>
            {events.length} events across all customers
          </p>
        </div>
      </div>

      <div style={{ position: "relative", paddingLeft: "32px" }}>
        <div
          style={{
            position: "absolute",
            left: "10px",
            top: "8px",
            bottom: "8px",
            width: "2px",
            background: "#e9d5ff",
            borderRadius: "1px",
          }}
        />

        {events.map((event, index) => {
          const sc = statusColors[event.status] || { bg: "#f3f4f6", color: "#374151" };
          return (
            <div
              key={event.id}
              style={{
                position: "relative",
                marginBottom: index === events.length - 1 ? 0 : "16px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "-26px",
                  top: "14px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: event.dotBg,
                  border: `2px solid ${event.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: event.color,
                  }}
                />
              </div>

              <div
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(eventNode) => {
                  eventNode.currentTarget.style.borderColor = "#c4b5fd";
                }}
                onMouseLeave={(eventNode) => {
                  eventNode.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontWeight: "600", fontSize: "14px", color: event.color }}>{event.label}</span>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>{formatDate(event.date)}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "6px" }}>
                  {event.customerName}
                  <span style={{ color: "#9ca3af", margin: "0 6px" }}>.</span>
                  <span style={{ color: "#6b7280" }}>{event.customerRef}</span>
                  <span style={{ color: "#9ca3af", margin: "0 6px" }}>.</span>
                  <span style={{ fontWeight: "500", color: "#1f2937" }}>
                    {event.amount === null ? "No invoices yet" : `Rs ${Number(event.amount || 0).toLocaleString()}`}
                  </span>
                </div>
                <span
                  style={{
                    display: "inline-block",
                    background: sc.bg,
                    color: sc.color,
                    fontSize: "11px",
                    fontWeight: "500",
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}
                >
                  {event.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityTimeline;