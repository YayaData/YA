import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("userToken");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("userToken");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const requestMagicLink = async (email) => {
    const response = await axios.post(`${API}/auth/magic-link`, { email });
    return response.data;
  };

  const verifyMagicLink = async (magicToken) => {
    const response = await axios.post(`${API}/auth/verify`, { token: magicToken });
    if (response.data.success && response.data.token) {
      localStorage.setItem("userToken", response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const completeOnboarding = async (data) => {
    const response = await axios.post(`${API}/auth/onboarding`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      setUser(prev => ({
        ...prev,
        ...data,
        onboarding_complete: true
      }));
    }
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await axios.put(`${API}/user/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      setUser(prev => ({ ...prev, ...data }));
    }
    return response.data;
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    requestMagicLink,
    verifyMagicLink,
    completeOnboarding,
    logout,
    updateProfile,
    getAuthHeaders,
    refreshUser: () => token && fetchUser(token)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
