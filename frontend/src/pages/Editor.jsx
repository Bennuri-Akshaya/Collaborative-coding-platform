import { useParams, useNavigate } from "react-router-dom";
import {
  Copy,
  Check,
  Users,
  Code,
  MessageSquare,
  Send,
  X,
  ChevronDown,
  Play,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { validateRoom,leaveRoom } from "../api/api";
import { io } from "socket.io-client";//socket io in frontend

//CHAT WIDGET
function ChatWidget({ isOpen, setIsOpen , socket , roomId , username }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(()=>{
    if(!socket) return;

    //removing prev listeners to avoid duplicates when chat widget is opened multiple times
    socket.off("chat:history");
    socket.off("chat:receive");
    socket.off("typing:start");
    socket.off("typing:stop");

    socket.on("chat:history",(history)=>{
      console.log("Chat history:", history);
      setMessages(history);
    });
    socket.on("chat:receive",(message)=>{
      setMessages((prev) => {
        if(message._id && prev.some((m) => m._id === message._id))  return prev;
        return [...prev, message];
      });
    });

    //typing start
    socket.on("typing:start",(user)=>{
      if(user === username) return; //never show the user name to himself
      setTypingUsers((prev) => prev.includes(user) ? prev : [...prev, user]);
    })

    //typing stop
    socket.on("typing:stop",(user)=>{
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    })

    socket.emit("chat:request-history", {roomId});
    return () =>{
      socket.off("chat:history");
      socket.off("chat:receive");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  },[socket,username]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    console.log("Send clicked");
    if (!inputValue.trim()) return;

    socket.emit("chat:send",{
      roomId,
      sender:username,
      message: inputValue.trim(),
    });

    socket.emit("typing:stop", {roomId,username});

    setInputValue("");
  };

  const handleTyping = (e)=>{
    const value = e.target.value;
    setInputValue(value);

    socket.emit("typing:start", {roomId,username});

    if(typingTimeoutRef.current){
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", {roomId,username});
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-xl shadow-xl flex flex-col h-64">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-blue-400" />
          <h3 className="font-semibold text-sm text-white">Room Chat</h3>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/10 rounded transition"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m,index) => {

          const isSystem = m.sender === "System";
          return(
          <div key={index}>
            <div className="flex items-baseline gap-2">
              <span className={`text-xs font-semibold ${m.sender === username ? "text-blue-300" : "text-gray-400"}`}>
                {m.sender}
              </span>
              <span className="text-[10px] text-gray-500">{new Date(m.createdAt).toLocaleTimeString([],{
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
            </div>
            <p
              className={`text-xs p-2 rounded-lg mt-1 ${
                isSystem
                ?"bg-purple-500/10 text-purple-300 italic text-center"
                :m.sender === username
                  ? "bg-blue-500/20 text-white"
                  : "bg-white/5 text-gray-300"
              }`}
            >
              {m.message}
            </p>
          </div>
        )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* //Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 pb-2 text-xs text-blue-300 italic">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}
      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-white/10 px-3 py-3 flex items-center gap-2">
        <input
          value={inputValue}
          onChange={handleTyping}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-40"
        >
          <Send size={16} className="text-white" />
        </button>
      </form>
    </div>
  );
}

// --------------------------- MAIN EDITOR PAGE --------------------------------
export default function EditorPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const socketRef = useRef(null);

  //to check if user has access to the room when component mounts, if not redirect to auth page
  useEffect(() =>{
    const checkAccess = async()=>{
      try{
        await validateRoom(roomId);
      }catch(error){
        navigate("/auth",{
          state: { from: `/editor/${roomId}` },
        });
      }
    };
    checkAccess();
  },[roomId,navigate]);

  //this useeffect is for socket connection and mounting participants list 
  useEffect(()=>{
    socketRef.current =io("http://localhost:5000");
    
    socketRef.current.on("participants-joined",(participants)=>{
      console.log("Participants:",participants);
      setParticipants(participants);
    });
    
    socketRef.current.on("connect",()=>{
      console.log("Connected to socket server with id: " + socketRef.current.id);
      console.log("Sending token:", localStorage.getItem("token"));
      socketRef.current.emit("join-room",{
        roomId,
        token: localStorage.getItem("token"),
      });
    });

    return () =>{
      socketRef.current.disconnect();
    }
  },[roomId]);

  const currentUsername = localStorage.getItem("username");
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [code, setCode] = useState(`// Welcome to CoDev!\n// Start coding here...\n\nfunction hello() {\n  console.log("Hello, World!");\n}\n\nhello();`);
  const [output, setOutput] = useState("// Output will appear here...\n");
  const [language, setLanguage] = useState("javascript");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
  ];

  const handleCopyId = () => {
    const fullLink = `${window.location.origin}/editor/${roomId}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = async () => {
    try{
      if(socketRef.current){
        socketRef.current.disconnect();
      }
      navigate("/rooms");
    }catch(error){
      console.error("Failed to leave room:", error);
    }
  }
  const runJS = () => {
    try {
      let logs = [];
      const originalLog = console.log;

      console.log = (...args) => logs.push(args.join(" "));

      // eslint-disable-next-line no-new-func
      new Function(code)();

      console.log = originalLog;

      setOutput(logs.join("\n") || "// No output.");
    } catch (err) {
      setOutput("Error: " + err.message);
    }
  };

  const runCode = () => {
    if (language !== "javascript") {
      setOutput(`// "${language}" execution is not enabled in this prototype.`);
      return;
    }
    runJS();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      
      {/* HEADER */}
      <div className="bg-white/5 border-b border-white/10 backdrop-blur-sm">
        <div className="px-6 max-w-full mx-auto">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="https://i.pinimg.com/736x/5d/12/d0/5d12d0e14bd2110a430aa44555a2bdcb.jpg"
                className="w-6 h-6 rounded-full"
              />
              <div className="font-bold text-lg">
                <span className="text-white">Co</span>
                <span className="text-blue-400">Dev</span>
              </div>
            </div>

            {/* Room ID */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-400">Room ID:</span>
              <code className="text-sm font-mono text-blue-400">{roomId}</code>

              <button onClick={handleCopyId} className="p-1 hover:bg-white/10 rounded">
                {copied ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>

            {/* Leave Button */}
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-700 hover:bg-red-900 border border-red-600 rounded-lg text-sm"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">

          {/* SIDEBAR*/}
          <div className="h-full flex flex-col overflow-hidden min-h-0">

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-shrink-0 overflow-y-auto max-h-64">
           <div className="flex items-center gap-2 mb-3">
              <Users size={20} className="text-gray-400" />
              <h2 className="font-semibold text-lg">Participants</h2>
            </div>

            {participants.length === 0 ? (
               <p className="text-xs text-gray-500 mt-3 text-center">
                  Waiting for others to join…
                </p>
              ) : (
             participants.map((participant) => (
      <div
        key={participant.socketId}
        className="flex items-center gap-3 bg-white/5 p-3 rounded-lg mb-2"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold">
          {participant.username.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium">
            {participant.username === currentUsername
              ? "You"
              : participant.username}
          </p>

          <p className="text-xs text-gray-500">
            {participant.role === "host" ? "Host" : "Participant"}
          </p>
        </div>

        <span className="px-2 py-1 text-xs text-green-400 bg-green-500/20 border border-green-500/30 rounded-full">
          Online
        </span>
      </div>
    ))
  )}
</div>

            {/* Chat area below participants */}
            <div className="mt-4 flex-1 min-h-0 flex flex-col">
              {!isChatOpen ? (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="mt-auto w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm"
                >
                  <MessageSquare size={18} />
                  Open Chat
                </button>
              ) : (
                <ChatWidget isOpen={isChatOpen} setIsOpen={setIsChatOpen} socket={socketRef.current} roomId={roomId} username={currentUsername}/>
              )}
            </div>
          </div>

          {/*EDITOR + OUTPUT*/}
          <div className="lg:col-span-3 h-125 flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden">

            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-blue-400" />
                <span className="text-gray-300 text-sm">Code Editor</span>
              </div>

              <div className="flex items-center gap-3">

                {/* Run Button */}
                <button
                  onClick={runCode}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg text-white text-sm"
                >
                  <Play size={16} />
                  Run
                </button>

                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsLanguageDropdownOpen(!isLanguageDropdownOpen)
                    }
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2"
                  >
                    <span className="text-gray-300 text-sm">
                      {languages.find((l) => l.value === language)?.label}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {isLanguageDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-white/10 rounded-lg shadow-xl py-1 z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => {
                            setLanguage(lang.value);
                            setIsLanguageDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-sm text-left hover:bg-white/10 ${
                            language === lang.value
                              ? "text-blue-400 bg-white/5"
                              : "text-gray-300"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Editor + Output */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  value={code}
                  language={language}
                  theme="vs-dark"
                  onChange={(v) => setCode(v ?? "")}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: "on",
                    padding: { top: 16 },
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Output Panel */}
              <div className="h-40 bg-black/40 border-t border-white/10 px-4 py-3 overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-300 uppercase">Output</span>
                  <span className="text-[10px] text-gray-500">Console</span>
                </div>

                <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                  {output}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
