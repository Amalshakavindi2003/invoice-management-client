export const getToken = () => localStorage.getItem("ei_token");

export const getUser = () => {
  const user = localStorage.getItem("ei_user");
  return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => {
  const token = getToken();
  if (!token) {
    return false;
  }

  return token.split(".").length === 3;
};

export const logout = () => {
  localStorage.removeItem("ei_token");
  localStorage.removeItem("ei_user");
  window.location.href = "/login";
};

export const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};