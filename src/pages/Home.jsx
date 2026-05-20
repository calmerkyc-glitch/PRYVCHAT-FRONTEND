import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm.jsx";
import OtpForm from "../components/OtpForm.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [otpError, setOtpError] = useState(null);
  const [previewOtp, setPreviewOtp] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleVerified = (user, token) => {
    login(user, token);
    navigate("/chat");
  };

  const isOtpScreen = !!userData || previewOtp;

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-4 sm:px-6 sm:py-6">
      <div className={`mx-auto flex w-full max-w-3xl flex-col gap-4 ${isOtpScreen ? "items-start justify-start" : "items-center justify-center"}`}>
        {import.meta.env.DEV && !isOtpScreen && (
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={() => {
                setPreviewOtp(true);
                setOtpError(null);
              }}
              className="text-sm text-indigo-700 hover:text-indigo-900 transition"
            >
              Preview OTP screen
            </button>
          </div>
        )}

        {!isOtpScreen ? (
          <RegisterForm onOtpSent={setUserData} />
        ) : (
          <OtpForm
            userData={userData || {}}
            onVerified={handleVerified}
            onError={setOtpError}
            onBack={() => {
              setUserData(null);
              setPreviewOtp(false);
              setOtpError(null);
            }}
          />
        )}
      </div>
      {otpError && <p className="mt-4 text-center text-red-600">{otpError}</p>}
    </div>
  );
}
