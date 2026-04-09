import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();
  const logo = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuCS8_9DX_Htx0RJKRFyHn1-zVOIZxT-PMl_AdNjsM&s";

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" color="secondary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <img src={logo} alt="logo" style={{ width: 120 }} />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={Link}
            to="/"
            variant={isActive("/") ? "contained" : "outlined"}
            sx={{ color: "white", borderColor: "white" }}
          >
            Admin Dashboard
          </Button>
          <Button
            component={Link}
            to="/my-invoices"
            variant={isActive("/my-invoices") ? "contained" : "outlined"}
            sx={{ color: "white", borderColor: "white" }}
          >
            My Invoices
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;