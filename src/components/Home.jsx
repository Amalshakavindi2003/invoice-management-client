import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import AddInvoice from "./AddInvoice";
import CustomerManager from "./CustomerManager";
import { getAllCustomers, getAllInvoice } from "../Services/api";

function Home() {
  const [addInvoice, setAddInvoice] = useState(false);
  const [showCustomers, setShowCustomers] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoiceCustomerId, setInvoiceCustomerId] = useState(null);

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

  const openInvoiceForCustomer = (customerId = null) => {
    setInvoiceCustomerId(customerId);
    setAddInvoice(true);
  };

  const handleInvoiceSaved = async () => {
    await loadInvoices();
    await loadCustomers();
    setInvoiceCustomerId(null);
  };

  return (
    <Box sx={{ margin: 2.5 }}>
      <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Invoice Operations</Typography>
      <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
        {!addInvoice && (
          <Button variant="outlined" onClick={() => openInvoiceForCustomer()}>
            Add Invoice
          </Button>
        )}
        {addInvoice && (
          <Button
            variant="outlined"
            onClick={() => {
              setAddInvoice(false);
              setInvoiceCustomerId(null);
            }}
          >
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
          onSaved={handleInvoiceSaved}
          initialCustomerId={invoiceCustomerId}
        />
      )}

      {showCustomers && (
        <CustomerManager
          customers={customers}
          invoices={invoices}
          onCustomersChanged={loadCustomers}
          onInvoicesChanged={loadInvoices}
          onCreateInvoiceForCustomer={openInvoiceForCustomer}
        />
      )}
    </Box>
  );
}

export default Home;