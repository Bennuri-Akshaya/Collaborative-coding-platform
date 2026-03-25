import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export default function Rooms() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const handleJoinRoom = async () => {
    try{
      console.log("Join clicked");
      let value = roomId.trim();

      if(value.includes("/editor/")){
        value = value.split("/editor/")[1];
      }
      navigate(`/editor/${value}`);
    }catch(error){
      alert("Room does not exist")
    }
    }

  const handleCreateRoom = () => {
    navigate('/create-room');
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
                Welcome to
              </span>
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {" "}CodeV
              </span>
            </h1>
            <p className="text-gray-400">Create or join a room to get started</p>
          </div>

          <div className="space-y-6">
            {/* Create Room Button */}
            <button
              onClick={handleCreateRoom}
              className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center gap-3 text-lg font-semibold transition-colors"
            >
              <Plus size={24} />
              <span>Create Room</span>
            </button>

            {/* Divider with "or" */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-950 text-gray-400 font-medium">or</span>
              </div>
            </div>

            {/* Join Room Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center">Join Room</h2>

              {/* Room ID Input */}
              <div>
                <input
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
                  className="w-full h-12 text-base bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Join Room Button */}
              <button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}