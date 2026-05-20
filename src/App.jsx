import { useState, useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import { AuthContext } from "./context/AuthContext.jsx";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { user } = useContext(AuthContext);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/chat" /> : <Home />} />
        <Route path="/chat" element={user ? <ChatWindow /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
