export const getToken = () => null;
export const getUser = () => null;
export const isLoggedIn = () => false;
export const logout = () => {
  window.location.href = "/";
};
export const authHeaders = () => ({
  "Content-Type": "application/json",
});