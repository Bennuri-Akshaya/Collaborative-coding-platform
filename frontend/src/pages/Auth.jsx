import { useState,useEffect } from "react";
import { useNavigate,useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { signIn, signUp } from "../api/api";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("signin"); // "signin" or "signup"
  const [rememberMe, setRememberMe] = useState(false);
  // Sign In form state
  const [signInData, setSignInData] = useState({
    username: "",
    password: "",
  });

  // Sign Up form state
  const [signUpData, setSignUpData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  
  const redirectPath = location.state?.from || "/rooms";
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
  //below is to validate that username and password is provided
  if (!signInData.username || !signInData.password) {
    alert("Please enter both username and password.");
    return;
  }
  try{
    console.log("Sign in clicked");
    const res = await signIn(signInData);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("username", res.data.username);
    navigate(redirectPath, { replace: true });
    if (rememberMe) {
  localStorage.setItem("savedUsername", signInData.username);
} else {
  localStorage.removeItem("savedUsername");
}
  }
  catch(err){
    console.log(err);
    alert("Sign in failed. Please check your credentials.");
  }
};

  const handleSignUpSubmit = async (e) => {
  e.preventDefault();

  if (!signUpData.username || !signUpData.password || !signUpData.confirmPassword) {
    alert("Please fill all fields.");
    return;
  }

  if (signUpData.password !== signUpData.confirmPassword) {
    alert("Passwords do not match.");
    return;
  }
  try{
    const res = await signUp({ username: signUpData.username, password: signUpData.password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("username", res.data.username);
    navigate(redirectPath, { replace: true });
  }
  catch(err){
    alert("Sign up failed. Please try another username.");
  }
};

useEffect(() => {
  const savedUsername = localStorage.getItem("savedUsername");

  if (savedUsername) {
    setSignInData((prev) => ({
      ...prev,
      username: savedUsername
    }));
    setRememberMe(true);
  }
}, []);
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-4 pb-12">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      {/* Centered column*/}
      <div className="w-full max-w-md relative">
        {/* Back to Home */}
        <button
          onClick={() => navigate("/")}
          className="mb-6 mt-3 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          ← Back to Home
        </button>

        {/* Auth Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden">
          {/* Brand Header */}
          <div className="p-6 pb-4 text-center border-b border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img
                src="https://i.pinimg.com/736x/5d/12/d0/5d12d0e14bd2110a430aa44555a2bdcb.jpg"
                alt="CoDev"
                className="w-8 h-8 rounded-full"
              />
              <h1 className="text-2xl font-bold">
                <span className="text-white">Co</span>
                <span className="text-blue-400">Dev</span>
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              Please enter your details
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "signin"
                  ? "text-white bg-white/5 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "signup"
                  ? "text-white bg-white/5 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Forms */}
          <div className="p-6 sm:p-8">
            {activeTab === "signin" ? (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="signin-username"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Username
                  </label>
                  <input
                    id="signin-username"
                    type="text"
                    required
                    placeholder="Enter your username"
                    value={signInData.username}
                    onChange={(e) =>
                      setSignInData({ ...signInData, username: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signin-password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="signin-password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={signInData.password}
                    onChange={(e) =>
                      setSignInData({ ...signInData, password: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white rounded-lg font-semibold transition-all hover:scale-102 shadow-lg shadow-blue-500/20"
                >
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </button>

                <p className="text-center text-sm text-gray-400 pt-2">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-username"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Username
                  </label>
                  <input
                    id="signup-username"
                    type="text"
                    required
                    placeholder="Choose a username"
                    value={signUpData.username}
                    onChange={(e) =>
                      setSignUpData({ ...signUpData, username: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    placeholder="Create a password"
                    value={signUpData.password}
                    onChange={(e) =>
                      setSignUpData({ ...signUpData, password: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    required
                    placeholder="Confirm your password"
                    value={signUpData.confirmPassword}
                    onChange={(e) =>
                      setSignUpData({
                        ...signUpData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <label className="flex items-start gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span>I agree to the Terms of Service and Privacy Policy</span>
                </label>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white rounded-lg font-semibold transition-all hover:scale-102 shadow-lg shadow-blue-500/20"
                >
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </button>

                <p className="text-center text-sm text-gray-400 pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signin")}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
