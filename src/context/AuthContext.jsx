import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("pryv_user");
    if (token && savedUser) {
      setUser({ token, user: JSON.parse(savedUser) });
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("pryv_user", JSON.stringify(userData));
    setUser({ token, user: userData });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("pryv_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
