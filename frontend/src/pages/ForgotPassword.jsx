//When the user clicks on the forgot password button redirected to new page 
//the user must enter the email he used in signup ,the reset link is sent to that email
//That page is forgot-password

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword(){
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const [loading,setLoading] = useState(false);
    const [sent,setSent] = useState(false);
    const handleForgotPassword = async (e) =>{
        e.preventDefault();

        if(loading || sent) return;

        setLoading(true);
        try{
            const res = await fetch("http://localhost:5000/auth/forgot-password",{
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });
            if(res.ok){
                setSent(true);
                alert("Reset link sent to your email");
            }
        }catch(err){
            console.error(err);
        }finally{
            setLoading(false);
        }
    };
    return(
        <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-4">
            {/* Background glow */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"/>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"/>

            <div className="w-full max-w-md">
                {/* Back button */}
                <button
                  onClick={() => navigate("/auth")}
                  className="mb-6 text-gray-400 hover:text-white text-sm"
                >
                    ← Back to Sign In
                </button>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm p-6">
                  <h2 className="text-xl font-bold mb-2 text-center">
                    Reset Password
                  </h2>
                  <p className="text-sm text-gray-400 text-center mb-6">
                    Enter your email to receive reset link
                  </p>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <input 
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}   
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"                   
                    />

                    <button
                       type="submit"
                       disabled={loading || sent}
                       className={`w-full px-6 py-3 rounded-lg font-semibold transition-all
                          ${loading || sent
                            ? "bg-gray-600 cursor-not-allowed" 
                            : "bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"}
                        `}
                    >
                         {sent ? "Email sent!" : loading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>
                </div>
            </div>
        </div>
    )
}