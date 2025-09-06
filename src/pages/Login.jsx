import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiConnector } from "../services/apiConnector";
import { companyEndpoints, endpoints } from "../services/api";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setRole,
  setSignupData,
  setToken,
} from "../slices/authSlice";
import toast from "react-hot-toast";
import logo from "../assets/images/WhatsApp Image 2025-06-30 at 16.52.32_498f8c48.jpg";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { setCompany, setPermissions, setSubAdminPermissions } from "../slices/companyPermission";
import { setReduxShifts } from "../slices/shiftSlice";
import { setReduxManagers } from "../slices/manager";
import { setReduxDepartments } from "../slices/departments";
import { setReduxEmployee } from "../slices/employee";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

const { LOGIN_API } = endpoints;
const { GET_COMPANY_DETAILS } = companyEndpoints;

const Login = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.loading);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const getCompanyDetails = async (companyId) => {
    try {
      setLoading(true);
      const comp = await apiConnector("GET", GET_COMPANY_DETAILS + companyId);
      console.log("company => ", comp);

      const companyData = comp.data.data;

      if (companyData) {
        dispatch(setCompany(companyData));
        dispatch(setPermissions(companyData.permissions || []));
        dispatch(setReduxShifts(null));
        dispatch(setReduxManagers(null));
        dispatch(setReduxDepartments(null));
    
      } else {
        console.warn("No company data received");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } 
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await apiConnector("POST", LOGIN_API, formData);

      console.log(response);
      dispatch(setToken(response.data.token));
      dispatch(setSignupData(response.data.data));
      dispatch(setRole(response.data.data.user.role));

      if (response.data.data.user.role === "superadmin") {
        navigate("/dashboard");
      } else if (response.data.data.user.role === "admin") {
        getCompanyDetails(response.data.data.user.companyId);
        navigate("/adminpanel");
      } else if (response.data.data.user.role === "subadmin") {
        dispatch(setSubAdminPermissions(response.data.data.user.permissions))
        getCompanyDetails(response.data.data.user.companyId._id);
        navigate("/subadminpanel");
      } else {
        dispatch(setReduxEmployee(response.data.data.user));
        console.log(response)
        dispatch(setCompany(response.data.data.user.companyId));
        navigate("/employeepanel");
      }
      toast.success("Logged In successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Unable to LogIn!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="flex flex-col overflow-x-hidden min-h-screen">
      <Header />
      <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-8">
        <div className="w-full max-w-md">
          <form
            onSubmit={submitHandler}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-12 text-center">
              <div className="mb-6">
                <img 
                  src={logo} 
                  alt="MASU" 
                  className="w-20 h-20 mx-auto rounded-full border-4 border-white shadow-lg object-cover"
                />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-blue-100">Sign in to your account</p>
            </div>

            {/* Form Section */}
            <div className="px-8 py-8">
              {/* Email Field */}
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-gray-700 text-sm font-semibold mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    onChange={changeHandler}
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 animate-pulse">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-gray-700 text-sm font-semibold mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    onChange={changeHandler}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={formData.password}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.password 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 animate-pulse">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white py-3 px-4 rounded-lg font-semibold text-lg shadow-lg hover:from-blue-900 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/forgetpassword")}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200 hover:underline focus:outline-none focus:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          </form>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Secure login protected by enterprise-grade encryption
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;