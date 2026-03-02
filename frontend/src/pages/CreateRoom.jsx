import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, ArrowRight } from "lucide-react";
import { createRoom } from "../api/api";
import { useRef } from "react";

export default function CreateRoom() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const hasCreated = useRef(false);

  useEffect(() =>{
    if(hasCreated.current) return; // Prevent multiple room creation on re-render
    hasCreated.current = true;
    
    const createNewRoom = async () =>{
      try{
        const res = await createRoom();
        setRoomId(res.data.roomId);
      }catch(error){
        console.log(error);
      }
    }
    createNewRoom();
  })

  const handleCopyId = () => {
    const fullLink = `${window.location.origin}/editor/${roomId}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    navigate(`/editor/${roomId}`);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={handleGoBack}
          className="mb-8 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          ← Back
        </button>

        {/* Main card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-8 backdrop-blur-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
                Room Created!
              </span>
            </h1>
            <p className="text-gray-400">Share this ID with your team</p>
          </div>

          <div className="space-y-6">
            {/* Room ID Display */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 block">
                Your Room ID
              </label>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-lg font-mono text-blue-400 break-all flex-1">
                    {roomId}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title={copied ? "Copied!" : "Copy to clipboard"}
                  >
                    {copied ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <Copy size={20} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              {copied && (
                <p className="text-xs text-green-400 text-center animate-in fade-in duration-200">
                  Copied to clipboard!
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-300 text-center">
                Share this Room ID with your collaborators so they can join your coding session
              </p>
            </div>

            {/* Enter Room Button */}
            <button
              onClick={handleEnterRoom}
              className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center gap-3 text-lg font-semibold transition-colors"
            >
              <span>Enter Room</span>
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
