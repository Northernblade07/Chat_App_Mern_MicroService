import Cookies from "js-cookie";

export const getToken = () => {
  const token = Cookies.get("token");

  // Guard against garbage values
  if (!token || token === "undefined" || token === "null") {
    return;
  }

  return token;
};
