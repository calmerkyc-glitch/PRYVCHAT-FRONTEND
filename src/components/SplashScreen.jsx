import { useEffect } from "react";
import "../styles/splash.css";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 12000); // 12 seconds for longer animation display
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-container">
      {/* Background with smiley design */}
      <div className="splash-background"></div>
      
      {/* Central content */}
      <div className="splash-content">
        {/* Decorative circle background for spinner */}
        <div className="splash-circle-bg"></div>
        
        {/* Advanced spinner */}
        <div className="splash-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring spinner-ring-2"></div>
        </div>

        {/* Animated app name and loading text */}
        <div className="splash-text-container">
          <h1 className="splash-title">Pryv Chat</h1>
          <p className="splash-loading">Loading...</p>
        </div>
      </div>

      {/* Animated background shapes */}
      <div className="splash-decoration splash-decoration-1"></div>
      <div className="splash-decoration splash-decoration-2"></div>
    </div>
  );
}
