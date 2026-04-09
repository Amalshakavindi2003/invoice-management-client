import { Box, Button, Typography } from "@mui/material";
import Header from "./Header";
import AddInvoice from "./AddInvoice";
import { useEffect, useState } from "react";
import CustomerManager from "./CustomerManager";
import { deleteInvoice, getAllCustomers, getAllInvoice } from "../Services/api";

function Home() {
  const [addInvoice, setAddInvoice] = useState(false);
  const [showCustomers, setShowCustomers] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);

  const loadInvoices = async () => {
    try {
      const response = await getAllInvoice();
      setInvoices(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error.message);
      setInvoices([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await getAllCustomers();
      setCustomers(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch customers:", error.message);
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, []);

  const markInvoiceDone = async (invoiceId) => {
    try {
      await deleteInvoice(invoiceId);
      await loadInvoices();
    } catch (error) {
      console.error("Failed to mark invoice as done:", error.message);
    }
  };

  return (
    <>
      <Header />
      <Box sx={{ margin: 2.5 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Pending Invoices</Typography>
        <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
          {!addInvoice && (
            <Button variant="outlined" onClick={() => setAddInvoice(true)}>
              Add Invoice
            </Button>
          )}
          {addInvoice && (
            <Button variant="outlined" onClick={() => setAddInvoice(false)}>
              Hide Invoice Form
            </Button>
          )}
          <Button variant="outlined" onClick={() => setShowCustomers((prev) => !prev)}>
            {showCustomers ? "Hide Customers" : "Manage Customers"}
          </Button>
        </Box>

        {addInvoice && (
          <AddInvoice
            setAddInvoice={setAddInvoice}
            customers={customers}
            onSaved={loadInvoices}
          />
        )}

        {showCustomers && (
          <CustomerManager
            customers={customers}
            invoices={invoices}
            onCustomersChanged={loadCustomers}
            onInvoicesChanged={loadInvoices}
            onMarkInvoiceDone={markInvoiceDone}
          />
        )}
      </Box>
    </>
  );
}

export default Home;