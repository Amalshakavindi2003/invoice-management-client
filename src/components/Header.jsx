import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { getUser, logout } from "../utils/auth";

function Header({ user: userProp }) {
  const location = useLocation();
  const logo = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuCS8_9DX_Htx0RJKRFyHn1-zVOIZxT-PMl_AdNjsM&s";

  const user = userProp || getUser();
  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" color="secondary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <img src={logo} alt="logo" style={{ width: 120 }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Button
            component={Link}
            to="/"
            variant={isActive("/") ? "contained" : "outlined"}
            sx={{ color: "white", borderColor: "white" }}
          >
            <span className="nav-full">ADMIN DASHBOARD</span>
            <span className="nav-short" style={{ display: "none" }}>
              Admin
            </span>
          </Button>
          <Button
            component={Link}
            to="/my-invoices"
            variant={isActive("/my-invoices") ? "contained" : "outlined"}
            sx={{ color: "white", borderColor: "white" }}
          >
            <span className="nav-full">MY INVOICES</span>
            <span className="nav-short" style={{ display: "none" }}>
              Invoices
            </span>
          </Button>

          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, ml: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {(user.fullName || "A").charAt(0).toUpperCase()}
                </Box>
                <Typography sx={{ color: "#f5f3ff", fontSize: "13px", fontWeight: 500 }}>
                  {user.fullName || user.email}
                </Typography>
              </Box>
              <Button
                onClick={logout}
                sx={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "none",
                }}
              >
                Sign Out
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;