import { AppBar, Toolbar } from "@mui/material";

function Header() {
  const logo = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuCS8_9DX_Htx0RJKRFyHn1-zVOIZxT-PMl_AdNjsM&s";

  return (
    <AppBar position="static" color="secondary">
      <Toolbar>
        <img src={logo} alt="logo" style={{ width: 120 }} />
      </Toolbar>
    </AppBar>
  );
}

export default Header;
