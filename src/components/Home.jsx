import { Box, Button, Typography } from "@mui/material";
import Header from "./Header";
import AddInvoice from "./AddInvoice";
import { useEffect, useState } from "react";
import Invoices from "./Invoices";
import { getAllInvoice, deleteInvoice } from "../Services/api";

function Home() {
  const [addInvoice, setAddInvoice] = useState(false);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const response = await getAllInvoice();
      setInvoices(response.data);
    };
    getData();
  }, [addInvoice]);

  const toggleInvoice = () => {
    setAddInvoice(true);
  };

  const removeInvoice = async (id) => {
    await deleteInvoice(id);
    const updatedInvoice = invoices.filter((invoice) => invoice.id !== id);
    setInvoices(updatedInvoice);
  };

  return (
    <>
      <Header />
      <Box style={{ margin: 20 }}>
        <Typography>Pending Invoices</Typography>
        {!addInvoice && (
          <Button
            variant="outlined"
            onClick={() => toggleInvoice()}
            style={{ marginTop: 15 }}
          >
            Add Invoice
          </Button>
        )}
        {addInvoice && <AddInvoice setAddInvoice={setAddInvoice} />}
        <Box>
          <Invoices invoices={invoices} removeInvoice={removeInvoice} />
        </Box>
      </Box>
    </>
  );
}

export default Home;
