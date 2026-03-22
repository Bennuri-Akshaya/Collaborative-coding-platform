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
import Split from "react-split";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

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
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);

  const currentUsername = localStorage.getItem("username");
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [output, setOutput] = useState("// Output will appear here...\n");
  const [language, setLanguage] = useState("javascript");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [isRunning, setIsRunning ] = useState(false);

  // Add this helper function outside the component
function getColorForUser(username) {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

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
        
    //Connection
    socketRef.current.on("connect",()=>{
      console.log("Connected to socket server with id: " + socketRef.current.id);
      console.log("Sending token:", localStorage.getItem("token"));
      socketRef.current.emit("join-room",{
        roomId,
        token: localStorage.getItem("token"),
      });
    });

    //Participants 
    socketRef.current.on("participants-joined",(participants)=>{
      console.log("Participants:",participants);
      setParticipants(participants);
    });

    //Execution listeners
    socketRef.current.on("execution:queued",({ triggeredBy , language })=>{
      setIsRunning(true);
      setOutput(`Running ${language}... (triggered by ${triggeredBy})`);
    });
    //Execution completed - show the result
    socketRef.current.on("execution:result",(data) =>{
      console.log("execution:result received in this tab", data);
      const { stdout, stderr, status, executionTime, triggeredBy, language: resultLanguage,} = data;
      setIsRunning(false);
      let result = "";
      if(stdout) result += stdout;
      if(stderr) result += `\n--- stderr ---\n${stderr}`;
      if(!stdout && !stderr) result = "//No output.";
      //Append metadata at bottom of output
      result += `\n\n--- ${status} | ${executionTime}ms | run by ${triggeredBy} ---`;
      setOutput(result);
    });

    //Execution rejected - room already running or rate limited
    socketRef.current.on("execution:rejected",({ message })=>{
      setIsRunning(false);
      setOutput(`// ${message}`);
    });

    //Execution error - validation or unexpected failure
    socketRef.current.on("execution:error",({ message })=>{
      setIsRunning(false);
      setOutput(`//Error: ${message}`);
    });

    return () =>{
      socketRef.current.disconnect();
    }
  },[roomId]);

  useEffect(() => {
  const ydoc = new Y.Doc();
  ydocRef.current = ydoc;

  const provider = new WebsocketProvider(
    "ws://localhost:1234",
    roomId,
    ydoc
  );
  providerRef.current = provider;

  provider.on("status", (e) => {
    console.log("Yjs status:", e.status);
  });

  const yText = ydoc.getText("monaco");
  //Shared language state vis YJS 
  //when any user changes language,everyone sees it
  const yLanguage = ydoc.getText("language");
  //Observe langugae changes from other users
  yLanguage.observe(() =>{
    const lang = yLanguage.toString();
    if(lang) setLanguage(lang);
  });

  // Insert default code only after initial sync
  provider.once("sync", () => {
    if (yText.length === 0) {
      yText.insert(
        0,
`// Welcome to CoDev!
// Start coding here...

function hello() {
  console.log("Hello, World!");
}

hello();
`
      );
    }
    //Set default language in YJS if not set
    if(yLanguage.length === 0){
      yLanguage.insert(0,"javascript");
    }
  });

  return () => {
    bindingRef.current?.destroy();
    provider.destroy();
    ydoc.destroy();
  };
}, [roomId]);

useEffect(()=>{
    fetch("http://localhost:5000/api/execution/languages")
    .then((res)=> res.json())
    .then((data) => {
      setLanguages(data);
      //Set default language to first/second i need to see on list
      if(data.length > 0) setLanguage(data[0].key);
    })
    .catch((err) => console.error("Failed to fetch languages:",err));
  },[]);

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

  const runCode = () => {
    console.log("runCode called");
    console.log("socket:",socketRef.current?.id);
    console.log("isRunning:", isRunning);
    console.log("ydoc:",ydocRef.current);
    console.log("code:",ydocRef.current?.getText("monaco").toString().slice(0,50));

    if (!socketRef.current) return;
    if (isRunning) return;
    //Read code directly from YJS document - not editor state
    //This ensures you get the latest collaborative content
    const code = ydocRef.current?.getText("monaco").toString();
    
    if(!code || code.trim().length === 0){
      setOutput("//Nothing to run.");
      return;
    }

    socketRef.current.emit("execution:request",{
      roomId,
      language,
      code,
      stdin: "",
    });
  };

  return (
       <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      
      {/* HEADER */}
      <div className="bg-white/5 border-b border-white/10 backdrop-blur-sm">
        <div className="px-6 max-w-full mx-auto">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center gap-2">
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
          <div className="lg:col-span-3 h-125 flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-y-auto">

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
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm transition-colors${
                    isRunning
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {isRunning ? (
                    <>
                    {/* For spinner while the code is getting executed */}
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Running...
                    </>
                  ):(
                    <>
                    <Play size={16}/>
                    Run
                    </>
                  )}
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
                      {languages.find((l) => l.key === language)?.label}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {isLanguageDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-white/10 rounded-lg shadow-xl py-1 z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          // Syncs via YJS to all collaborators
                          onClick={() => {
                            //Update Yjs shared language state
                            const yLanguage = ydocRef.current?.getText("language");
                            if(yLanguage){
                              yLanguage.delete(0,yLanguage.length);
                              yLanguage.insert(0,lang.key);
                            }
                            setLanguage(lang.key);
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
            {/* <div className="flex-1 flex flex-col min-h-0"> */}
            <Split
  direction="vertical"
  sizes={[75, 25]}
  minSize={80}
  gutterSize={6}
  className="flex-1 flex flex-col"
>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                 onMount={(editor, monaco) => {
  editorRef.current = editor;
  monacoRef.current = monaco;

  const ydoc = ydocRef.current;
  const provider = providerRef.current;
  if (!ydoc || !provider) return;

  // ✅ Force LF line endings to match Yjs internal format
  const model = editor.getModel();
  model.setEOL(monaco.editor.EndOfLineSequence.LF);
  const yText = ydoc.getText("monaco");

  const color = getColorForUser(currentUsername);

  // Set this user's awareness info (name + color)
  provider.awareness.setLocalStateField("user", {
    name: currentUsername,
    color: color,
  });

  bindingRef.current = new MonacoBinding(
    yText,
    model,
    new Set([editor]),
    provider.awareness
  );

  // Apply remote cursor styles dynamically as awareness changes
  const applyRemoteCursorStyles = () => {
  const states = provider.awareness.getStates();
  const styleId = "yjs-remote-cursor-styles";
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  let css = "";
  states.forEach((state, clientId) => {
    if (clientId === provider.awareness.clientID) return;
    const user = state.user;
    if (!user) return;

    css += `
      .yRemoteSelection-${clientId} {
        background-color: ${user.color};
      }
      .yRemoteSelectionHead-${clientId} {
        border-color: ${user.color};
        background-color: ${user.color};
      }
      .yRemoteSelectionHead-${clientId}::after {
        content: "${user.name}";
        background-color: ${user.color};
      }
    `;
  });

  styleEl.innerHTML = css;
};

  provider.awareness.on("change", applyRemoteCursorStyles);
  applyRemoteCursorStyles(); // run once on mount
}}
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
              <div className="h-40 bg-black/40 border-t border-white/10 px-4 py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-300 uppercase">Output</span>
                  <span className="text-[10px] text-gray-500">Console</span>
                </div>

                <pre className={`text-xs whitespace-pre-wrap font-mono ${
                  output.includes("Error") || output.includes("stderr") || output.includes("runtime_error") || output.includes("compile_error")
                    ? "text-red-400"
                    : "text-green-400"
                }`}>
                  {output}
                </pre>
              </div>
            </Split>
          </div>
        </div>
      </div>
    </div>
  );
}
