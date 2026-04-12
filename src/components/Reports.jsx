import { useEffect, useMemo, useState } from "react";
import { getCustomerInvoices, getInvoiceDate, getInvoiceDueDate, getInvoicePaid, getInvoiceStatus, getInvoiceTotal, getInvoiceBalance } from "../utils/invoiceData";
import jsPDF from "jspdf";
import RevenueChart from "./RevenueChart";

const getInvoices = (customer) => customer?.invoiceList || customer?.invoices || customer?.customerInvoices || [];

const statusPillStyle = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "paid") return { bg: "#dcfce7", color: "#166534" };
  if (value === "draft") return { bg: "#dbeafe", color: "#1e40af" };
  if (value === "overdue") return { bg: "#fee2e2", color: "#991b1b" };
  if (value === "partial") return { bg: "#fef3c7", color: "#92400e" };
  return { bg: "#f3f4f6", color: "#374151" };
};

function Reports({ customers = [], invoices = [], loading = false }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const stats = useMemo(() => {
    const empty = {
      totalBilled: 0,
      collected: 0,
      outstanding: 0,
      overdue: 0,
      totalCustomers: 0,
      invoicedCustomers: 0,
      totalInvoices: 0,
      collectionRate: 0,
    };

    if (!customers || customers.length === 0) return empty;

    let totalBilled = 0;
    let collected = 0;
    let outstanding = 0;
    let overdue = 0;
    let totalInvoices = 0;
    let invoicedCustomers = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    customers.forEach((customer) => {
      const customerInvoices = getCustomerInvoices(customer, invoices);

      if (customerInvoices.length > 0) invoicedCustomers += 1;
      totalInvoices += customerInvoices.length;

      customerInvoices.forEach((inv) => {
        const total = Number(getInvoiceTotal(inv) || 0);
        const paid = Number(getInvoicePaid(inv) || 0);
        const balance = Number(getInvoiceBalance(inv) || 0);
        const status = String(getInvoiceStatus(inv) || "");
        const dueStr = getInvoiceDueDate(inv) || "";
        const due = dueStr ? new Date(dueStr) : null;

        totalBilled += total;

        if (status === "Paid" || status.toLowerCase() === "paid") {
          collected += total;
        } else if (status === "Partial" || status.toLowerCase() === "partial") {
          collected += paid;
          outstanding += balance > 0 ? balance : total - paid;
        } else {
          outstanding += balance > 0 ? balance : total;
        }

        if (due && due < today && status.toLowerCase() !== "paid") {
          overdue += balance > 0 ? balance : total;
        }
      });
    });

    const collectionRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0;

    return {
      totalBilled,
      collected,
      outstanding,
      overdue,
      totalCustomers: customers.length,
      invoicedCustomers,
      totalInvoices,
      collectionRate,
    };
  }, [customers, invoices]);

  const topCustomers = useMemo(() => {
    return customers
      .map((customer) => {
        const customerInvoices = getCustomerInvoices(customer, invoices);

        const totalBilled = customerInvoices.reduce((sum, inv) => sum + Number(getInvoiceTotal(inv) || 0), 0);

        const totalPaid = customerInvoices.reduce((sum, inv) => {
          const status = String(getInvoiceStatus(inv) || "").toLowerCase();
          if (status === "paid") return sum + Number(getInvoiceTotal(inv) || 0);
          if (status === "partial") return sum + Number(getInvoicePaid(inv) || 0);
          return sum;
        }, 0);

        const balance = totalBilled - totalPaid;

        const latestInvoice =
          customerInvoices.length > 0
            ? [...customerInvoices].sort((a, b) => new Date(getInvoiceDate(b) || 0) - new Date(getInvoiceDate(a) || 0))[0]
            : null;

        return {
          name: customer.name,
          ref: customer.customerRef || customer.referenceCode || "-",
          invoiceCount: customerInvoices.length,
          totalBilled,
          totalPaid,
          balance,
          latestStatus: latestInvoice ? getInvoiceStatus(latestInvoice) || "—" : "—",
          collectionRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0,
        };
      })
      .filter((c) => c.invoiceCount > 0)
      .sort((a, b) => b.totalBilled - a.totalBilled)
      .slice(0, 10);
  }, [customers, invoices]);

  const handleExport = (type, fn) => {
    setExporting(type);
    fn();
    setTimeout(() => setExporting(null), 2000);
  };

  const generateCustomersCSV = () => {
    const headers = [
      "Customer Ref",
      "Name",
      "Email",
      "Phone",
      "Address",
      "Total Invoices",
      "Total Billed",
      "Total Collected",
      "Balance",
    ];

    const rows = customers.map((customer) => {
      const customerInvoices = getCustomerInvoices(customer, invoices);
      const totalBilled = customerInvoices.reduce((sum, inv) => sum + Number(getInvoiceTotal(inv) || 0), 0);
      const totalCollected = customerInvoices.reduce((sum, inv) => {
        const status = String(getInvoiceStatus(inv) || "").toLowerCase();
        if (status === "paid") return sum + Number(getInvoiceTotal(inv) || 0);
        if (status === "partial") return sum + Number(getInvoicePaid(inv) || 0);
        return sum;
      }, 0);

      return [
        customer.customerRef || customer.referenceCode || "",
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customerInvoices.length,
        totalBilled,
        totalCollected,
        totalBilled - totalCollected,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EasyInvoice_Customers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateInvoicesCSV = () => {
    const headers = [
      "Invoice ID",
      "Customer Ref",
      "Customer Name",
      "Date",
      "Due Date",
      "Status",
      "Total",
      "Paid",
      "Balance",
    ];

    const rows = [];
    customers.forEach((customer) => {
      const customerInvoices = getCustomerInvoices(customer, invoices);

      customerInvoices.forEach((inv) => {
        rows.push([
          inv.id,
          customer.customerRef || customer.referenceCode || "",
          customer.name,
          getInvoiceDate(inv) || "",
          getInvoiceDueDate(inv) || "",
          getInvoiceStatus(inv),
          Number(getInvoiceTotal(inv) || 0),
          Number(getInvoicePaid(inv) || 0),
          Number(getInvoiceBalance(inv) || 0),
        ]);
      });
    });

    rows.sort((a, b) => new Date(b[3]) - new Date(a[3]));

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EasyInvoice_Invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateSummaryPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFillColor(109, 40, 217);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("EasyInvoice", 14, 14);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Business Summary Report", 14, 22);
    doc.text(today, pageWidth - 14, 22, { align: "right" });

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, 46);

    const summaryItems = [
      ["Total Billed", `Rs ${stats.totalBilled.toLocaleString()}`],
      ["Total Collected", `Rs ${stats.collected.toLocaleString()}`],
      ["Outstanding", `Rs ${stats.outstanding.toLocaleString()}`],
      ["Overdue", `Rs ${stats.overdue.toLocaleString()}`],
      ["Collection Rate", `${stats.collectionRate}%`],
      ["Total Customers", String(stats.totalCustomers)],
      ["Total Invoices", String(stats.totalInvoices)],
    ];

    let y = 56;
    summaryItems.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 245, 255);
        doc.rect(14, y - 5, pageWidth - 28, 10, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(label, 20, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(109, 40, 217);
      doc.text(value, pageWidth - 20, y, { align: "right" });
      y += 12;
    });

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text("Top Customers", 14, y);
    y += 10;

    doc.setFillColor(109, 40, 217);
    doc.rect(14, y - 5, pageWidth - 28, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("Customer", 18, y);
    doc.text("Invoices", 100, y);
    doc.text("Total Billed", 130, y);
    doc.text("Collected", 163, y);
    doc.text("Rate", pageWidth - 18, y, { align: "right" });
    y += 10;

    topCustomers.slice(0, 8).forEach((c, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 248, 255);
        doc.rect(14, y - 5, pageWidth - 28, 10, "F");
      }
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.text(String(c.name || "").slice(0, 22), 18, y);
      doc.text(String(c.invoiceCount), 100, y);
      doc.text(`Rs ${c.totalBilled.toLocaleString()}`, 130, y);
      doc.text(`Rs ${c.totalPaid.toLocaleString()}`, 163, y);

      const rateColor =
        c.collectionRate >= 75
          ? [5, 150, 70]
          : c.collectionRate >= 50
            ? [180, 120, 6]
            : [180, 30, 30];
      doc.setTextColor(rateColor[0], rateColor[1], rateColor[2]);
      doc.text(`${c.collectionRate}%`, pageWidth - 18, y, { align: "right" });
      y += 10;
    });

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 275, pageWidth - 14, 275);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by EasyInvoice on ${today}`, pageWidth / 2, 281, { align: "center" });

    doc.save(`EasyInvoice_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "#9ca3af", fontSize: "14px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>📊</div>
        Loading report data...
      </div>
    );
  }

  const metrics = [
    { label: "Total Customers", value: stats.totalCustomers, icon: "👥", color: "#6d28d9" },
    { label: "Customers with Invoices", value: stats.invoicedCustomers, icon: "📄", color: "#0891b2" },
    { label: "Total Invoices Created", value: stats.totalInvoices, icon: "🧾", color: "#059669" },
    {
      label: "Collection Rate",
      value: `${stats.collectionRate}%`,
      icon: "📈",
      color: stats.collectionRate >= 75 ? "#059669" : stats.collectionRate >= 50 ? "#d97706" : "#dc2626",
    },
  ];

  return (
    <div style={{ marginTop: "16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: "16px",
        }}
      >
        <div style={{ borderRadius: "12px", padding: "18px 20px", border: "0.5px solid rgba(0,0,0,0.06)", background: "#f5f3ff" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", color: "#7c3aed" }}>Total Billed</div>
          <p style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#6d28d9" }}>Rs {stats.totalBilled.toLocaleString()}</p>
        </div>

        <div style={{ borderRadius: "12px", padding: "18px 20px", border: "0.5px solid rgba(0,0,0,0.06)", background: "#ecfdf5" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", color: "#059669" }}>Collected</div>
          <p style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#047857" }}>Rs {stats.collected.toLocaleString()}</p>
          <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>Collection rate: {stats.collectionRate}%</div>
        </div>

        <div style={{ borderRadius: "12px", padding: "18px 20px", border: "0.5px solid rgba(0,0,0,0.06)", background: "#fffbeb" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", color: "#d97706" }}>Outstanding</div>
          <p style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#b45309" }}>Rs {stats.outstanding.toLocaleString()}</p>
        </div>

        <div style={{ borderRadius: "12px", padding: "18px 20px", border: "0.5px solid rgba(0,0,0,0.06)", background: "#fef2f2" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", color: "#dc2626" }}>Overdue</div>
          <p style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#b91c1c" }}>Rs {stats.overdue.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px", flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ flex: 6, background: "white", borderRadius: "12px", border: "0.5px solid #e5e7eb", padding: "20px 24px" }}>
          <RevenueChart customers={customers} invoices={invoices} />
        </div>
        <div style={{ flex: 4, background: "white", borderRadius: "12px", border: "0.5px solid #e5e7eb", padding: "18px 20px" }}>
          <h3 style={{ margin: 0, color: "#1f2937", fontSize: "16px" }}>At a Glance</h3>
          <div style={{ marginTop: "10px" }}>
            {metrics.map((metric, index) => (
              <div key={metric.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: index === metrics.length - 1 ? "none" : "0.5px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{metric.icon}</span>
                  <span style={{ fontSize: "13px", color: "#4b5563" }}>{metric.label}</span>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 700, color: metric.color }}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "12px", border: "0.5px solid #e5e7eb", overflow: "hidden", marginTop: "20px" }}>
        <div style={{ padding: "16px 18px", borderBottom: "0.5px solid #f3f4f6" }}>
          <h3 style={{ margin: 0, color: "#1f2937", fontSize: "16px" }}>Top Customers by Invoice Value</h3>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>Ranked by total billed amount</p>
        </div>

        {topCustomers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "14px" }}>
            No invoice data yet. Add invoices to see rankings.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#6d28d9", color: "white", fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {[
                    "Rank",
                    "Customer",
                    "Ref",
                    "Invoices",
                    "Total Billed",
                    "Collected",
                    "Balance",
                    "Collection %",
                    "Status",
                  ].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, index) => {
                  const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1);
                  const pill = statusPillStyle(c.latestStatus);

                  return (
                    <tr key={`${c.ref}-${index}`} style={{ background: index % 2 === 1 ? "#fafafa" : "#fff", borderBottom: "0.5px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px", fontSize: index < 3 ? "16px" : "13px", textAlign: "center" }}>{medal}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px" }}>{c.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280" }}>{c.ref}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px" }}>{c.invoiceCount}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600 }}>Rs {c.totalBilled.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#047857", fontWeight: 600 }}>Rs {c.totalPaid.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#b45309", fontWeight: 600 }}>Rs {c.balance.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, width: 80, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${c.collectionRate}%`, background: c.collectionRate >= 75 ? "#10b981" : c.collectionRate >= 50 ? "#f59e0b" : "#ef4444", borderRadius: 4, transition: "width 0.5s ease" }} />
                          </div>
                          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: 6 }}>{c.collectionRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                        <span style={{ display: "inline-block", background: pill.bg, color: pill.color, padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600 }}>
                          {c.latestStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3 style={{ margin: 0, color: "#1f2937", fontSize: "16px" }}>Export Data</h3>
        <p style={{ margin: "4px 0 10px", fontSize: "13px", color: "#6b7280" }}>
          Download your data for records or accounting
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px", paddingTop: "8px" }}>
          <button
            onClick={() => handleExport("customers", generateCustomersCSV)}
            style={{ border: "1px solid #6d28d9", color: "#6d28d9", background: "white", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            {exporting === "customers" ? "✓ Downloaded!" : "⬇ Export Customers (.csv)"}
          </button>
          <button
            onClick={() => handleExport("invoices", generateInvoicesCSV)}
            style={{ border: "1px solid #6d28d9", color: "#6d28d9", background: "white", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            {exporting === "invoices" ? "✓ Downloaded!" : "⬇ Export Invoices (.csv)"}
          </button>
          <button
            onClick={() => handleExport("summary", generateSummaryPDF)}
            style={{ background: "#6d28d9", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            {exporting === "summary" ? "✓ Downloaded!" : "⬇ Summary Report (.pdf)"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;