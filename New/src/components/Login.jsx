import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { useNavigate, Link } from "react-router-dom"; // 👈 added Link
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.length) setErrors([]);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.length) setErrors([]);
  };

  const validateForm = () => {
    const newErrors = [];
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/i;

    if (!email.trim()) {
      newErrors.push("Email is required");
    } else if (!emailRegex.test(email)) {
      newErrors.push("Enter a valid email address");
    }

    if (!password) {
      newErrors.push("Password is required");
    } else if (password.length < 6) {
      newErrors.push("Password must be at least 6 characters");
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      console.log("Login response:", response.data.user);
      dispatch(setUser(response?.data?.user));
      navigate("/dashboard");

      setEmail("");
      setPassword("");
      setErrors([]);
    } catch (err) {
      if (err.response) {
        const serverMessage =
          err.response.data?.message || "Invalid email or password.";
        setErrors([serverMessage]);
      } else if (err.request) {
        setErrors(["Network error. Please check your connection."]);
      } else {
        setErrors(["An unexpected error occurred. Please try again."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleSubmitting(true);
    setErrors([]);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const { data } = await axios.post(
        `${API_BASE_URL}/auth/googleAuth`,
        {
          name: result.user.displayName,
          email: result.user.email,
        },
        { withCredentials: true }
      );

      console.log(data);
      dispatch(setUser(data?.user));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      // Firebase specific errors
      if (err.code === 'auth/popup-closed-by-user') {
        setErrors(['Popup closed before completing sign-in.']);
      } else if (err.code === 'auth/popup-blocked') {
        setErrors(['Popup was blocked. Please allow popups for this site.']);
      } else if (err.response) {
        setErrors([err.response.data?.message || 'Google sign-in failed.']);
      } else {
        setErrors(['An unexpected error occurred during Google sign-in.']);
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-center">
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-blue-100 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="you@example.com"
              disabled={isSubmitting || googleSubmitting}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
              disabled={isSubmitting || googleSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || googleSubmitting}
            className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 rounded-lg transition ${
              isSubmitting || googleSubmitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || googleSubmitting}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleSubmitting ? "Signing in..." : "Sign in with Google"}
          </button>

          {/* ✅ Fixed link – now points to sign-up page */}
          <p className="text-center text-xs text-gray-500 mt-2">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;