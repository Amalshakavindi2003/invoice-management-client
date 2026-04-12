import React, { useMemo } from "react";
import { getInvoiceDate, getInvoiceDueDate, getInvoicePaid, getInvoiceTotal, getInvoiceBalance } from "../utils/invoiceData";

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


function ActivityTimeline({ customers = [], invoices = [] }) {
  const events = useMemo(() => {
    if (!customers || customers.length === 0) return [];

    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    customers.forEach((customer) => {
      const customerRef = customer.referenceCode || customer.customerRef || "-";

      list.push({
        id: `cust-${customer.customerRef || customer.referenceCode || customer.id}`,
        type: "CustomerAdded",
        label: "Customer Added",
        date: customer.createdAt || customer.createdDate || new Date().toISOString(),
        customerName: customer.name,
        customerRef,
        amount: null,
        status: "Active",
        color: "#8b5cf6",
        dotBg: "#f5f3ff",
      });
    });

    (Array.isArray(invoices) ? invoices : []).forEach((inv) => {
      const customer = inv?.customer || {};
      const customerRef = customer.referenceCode || customer.customerRef || "-";
      const customerName = customer.name || inv?.vendor || "Unknown Customer";
      const dateStr = getInvoiceDate(inv);
      const dueStr = getInvoiceDueDate(inv);
      const status = String(toDisplayStatus(inv) || "");
      const total = Number(getInvoiceTotal(inv) || 0);
      const paid = Number(getInvoicePaid(inv) || 0);
      const balance = Number(getInvoiceBalance(inv) || Math.max(0, total - paid));
      const due = dueStr ? new Date(dueStr) : null;

      list.push({
        id: `created-${inv?.id}-${customer.id || customerRef}`,
        type: "Created",
        label: "Invoice Created",
        date: dateStr,
        customerName,
        customerRef,
        amount: total,
        status,
        color: "#6d28d9",
        dotBg: "#f5f3ff",
      });

      if (status === "Paid") {
        list.push({
          id: `paid-${inv?.id}-${customer.id || customerRef}`,
          type: "Paid",
          label: "Payment Received",
          date: dateStr,
          customerName,
          customerRef,
          amount: total,
          status: "Paid",
          color: "#10b981",
          dotBg: "#ecfdf5",
        });
      }

      if (status === "Partial") {
        list.push({
          id: `partial-${inv?.id}-${customer.id || customerRef}`,
          type: "Partial",
          label: "Partial Payment",
          date: dateStr,
          customerName,
          customerRef,
          amount: paid,
          status: "Partial",
          color: "#f59e0b",
          dotBg: "#fffbeb",
        });
      }

      if (due && due < today && status !== "Paid") {
        list.push({
          id: `overdue-${inv?.id}-${customer.id || customerRef}`,
          type: "Overdue",
          label: "Invoice Overdue",
          date: dueStr,
          customerName,
          customerRef,
          amount: balance > 0 ? balance : total,
          status: "Overdue",
          color: "#ef4444",
          dotBg: "#fef2f2",
        });
      }
    });

    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
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