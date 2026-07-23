import axios from "axios";
import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import { setUser } from "../redux/slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (errors.length) setErrors([]);
  };
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
    if (!name.trim()) newErrors.push("Name is required");
    else if (name.trim().length < 2) newErrors.push("Name must be at least 2 characters");

    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/i;
    if (!email.trim()) newErrors.push("Email is required");
    else if (!emailRegex.test(email)) newErrors.push("Enter a valid email address");

    if (!password) newErrors.push("Password is required");
    else if (password.length < 6) newErrors.push("Password must be at least 6 characters");

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
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
      });

      console.log("Registration response:", response.data);

      dispatch(setUser(response?.data?.user));
      navigate("/login");

      setName("");
      setEmail("");
      setPassword("");
      setErrors([]);
    } catch (err) {
      console.log(err);
      if (err.response) {
        const serverMessage = err.response.data?.message || "Registration failed. Please try again.";
        setErrors([serverMessage]);
      } else if (err.request) {
        setErrors(["Network error. Please check your connection."]);
      } else {
        setErrors(["An unexpected error occurred."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
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

      dispatch(setUser(data.user));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      // Handle Firebase specific errors
      if (err.code === 'auth/popup-closed-by-user') {
        setErrors(['Popup closed before completing sign-in.']);
      } else if (err.code === 'auth/popup-blocked') {
        setErrors(['Popup was blocked. Please allow popups for this site.']);
      } else if (err.response) {
        setErrors([err.response.data?.message || 'Google sign-up failed.']);
      } else {
        setErrors(['An unexpected error occurred during Google sign-up.']);
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-6 text-center">
          <h2 className="text-2xl font-bold text-white">Create an account</h2>
          <p className="text-blue-100 text-sm mt-1">Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="John Doe"
              disabled={isSubmitting || googleSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="you@example.com"
              disabled={isSubmitting || googleSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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

          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || googleSubmitting}
            className={`w-full bg-blue-600 text-white font-semibold py-2 rounded-lg transition ${
              isSubmitting || googleSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
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
            {googleSubmitting ? "Signing up..." : "Sign up with Google"}
          </button>

          {/* NEW LINK: Already have an account? Log in */}
          <div className="text-center text-sm mt-4">
            <span className="text-gray-600">Already have an account?</span>{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Log in
            </Link>
          </div>

          <p className="text-center text-xs text-gray-500 mt-2">
            By signing up, you agree to our Terms & Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;