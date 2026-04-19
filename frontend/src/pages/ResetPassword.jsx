//The reset link will navigate to this page
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye,EyeOff } from "lucide-react";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password,setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false)

    const handleResetPaassword = async (e) => {
        e.preventDefault();

        if(password !== confirmPassword){
            alert("Passwords do not match");
            return;
        }
        try{
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/reset-password/${token}`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body:JSON.stringify({ password }),
            });

            const data = await res.json();

            if(res.ok){
                alert("Password reset successful");
                navigate("/auth");
            }else{
                alert(data.message || "Error resetting password");
            }
        }catch(err){
            console.error(err);
            alert("Something went wrong");
        }
    };
    
    return(
        <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-4">
            {/* Background glow  */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

            <div className="w-full max-w-md">
                {/* Back */}
                <button
                   onClick={() => navigate("/auth")}
                   className="mb-6 text-gray-400 hover:text-white text-sm"
                >
                   ← Back to Sign In
                </button>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm p-6">
                   <h2 className="text-xl font-bold text-center mb-2">
                    Set New Password
                   </h2>

                   <p className="text-sm text-gray-400 text-center mb-6">
                    Enter your new password below
                   </p>
                   <form onSubmit={handleResetPaassword} className="space-y-4">
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          placeholder="New Password"
                          value={confirmPassword}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        <button 
                          type="button"
                          onClick={(e) => setConfirmPassword(e.target.value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>

                     <div className="relative">
                     <input
                       type={showConfirm ? "text" : "password"}
                       required
                       placeholder="Confirm Password"
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   
                     <button
                       type="button"
                       onClick={() => setShowConfirm(!showConfirm)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                     >
                       {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>

                    <button 
                       type="submit"
                        className="w-full px-6 py-3 from-blue-600  to-blue-400 text-white rounded-lg font-semibold"
                    >
                        Reset Password
                    </button>
                   </form>
                </div>
            </div>
        </div>
    )
}