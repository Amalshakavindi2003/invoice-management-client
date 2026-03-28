import styled from "@emotion/styled";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { saveInvoice } from "../Services/api";

const Component = styled(Box)({
  marginTop: 20,
  "& > p": {
    fontSize: 26,
    marginBottom: 10,
  },
  "& > div > div": {
    marginRight: 20,
    minWidth: 200,
  },
});

const defaultObj = {
  vendor: "",
  product: "",
  amount: 0,
  date: "",
  action: "pending",
};

function AddInvoice({ setAddInvoice }) {
  const [invoice, setInvoice] = useState(defaultObj);

  const onValueChange = (e) => {
    setInvoice({ ...invoice, [e.target.name]: e.target.value });
  };

  const addNewInvoice = async () => {
    await saveInvoice({ ...invoice, amount: Number(invoice["amount"]) });
    setAddInvoice(false);
  };

  return (
    <Component>
      <Typography>Add Invoice</Typography>
      <Box>
        <TextField
          onChange={onValueChange}
          placeholder="Enter vendor name"
          variant="standard"
          name="vendor"
        />
        <TextField
          onChange={onValueChange}
          placeholder="Enter product name"
          variant="standard"
          name="product"
        />
        <TextField
          onChange={onValueChange}
          type="number"
          placeholder="Enter amount in ₹"
          variant="standard"
          name="amount"
        />
        <TextField
          onChange={onValueChange}
          type="date"
          placeholder="Enter date"
          variant="standard"
          name="date"
        />
        <Button onClick={addNewInvoice} variant="outlined">
          Add Invoice
        </Button>
      </Box>
    </Component>
  );
}

export default AddInvoice;
