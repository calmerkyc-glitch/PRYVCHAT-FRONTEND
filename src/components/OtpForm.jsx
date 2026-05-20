import { useState } from "react";
import API from "../utils/api.js";

export default function OtpForm({ userData, onVerified, onError }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    onError(null);

    if (!otp.trim()) {
      onError("Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/verify-otp", { ...userData, otp });
      onVerified(res.data.user, res.data.token);
    } catch (err) {
      onError(err.response?.data?.error || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="p-4 bg-white shadow rounded w-full max-w-md">
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="border p-2 w-full mb-2"
      />
      <button
        type="submit"
        className="bg-green-600 text-white p-2 w-full disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}
