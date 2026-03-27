import { useParams, useNavigate } from "react-router-dom";
import {
  Copy,
  Check,
  Users,
  Code,
  MessageSquare,
  Send,
  ChevronDown,
  Play,
  LogOut,
} from "lucide-react";
import logo from '../assets/logo.png';
import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { validateRoom } from "../api/api";
import { io } from "socket.io-client";
import Split from "react-split";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

function ChatPanel({ socket, roomId, username }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.off("chat:history");
    socket.off("chat:receive");
    socket.off("typing:start");
    socket.off("typing:stop");

    socket.on("chat:history", (history) => {
      setMessages(history);
    });
    socket.on("chat:receive", (message) => {
      setMessages((prev) => {
        if (message._id && prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });
    socket.on("typing:start", (user) => {
      if (user === username) return;
      setTypingUsers((prev) => prev.includes(user) ? prev : [...prev, user]);
    });
    socket.on("typing:stop", (user) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    });

    socket.emit("chat:request-history", { roomId });

    return () => {
      socket.off("chat:history");
      socket.off("chat:receive");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [socket, username]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    socket.emit("chat:send", { roomId, sender: username, message: inputValue.trim() });
    socket.emit("typing:stop", { roomId, username });
    setInputValue("");
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setInputValue(value);
    socket.emit("typing:start", { roomId, username });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { roomId, username });
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-6">No messages yet</p>
        )}
        {messages.map((m, index) => {
          const isSystem = m.sender === "System";
          return (
            <div key={index}>
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-semibold ${
                  isSystem ? "text-purple-400" : m.sender === username ? "text-blue-300" : "text-gray-400"
                }`}>
                  {m.sender}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className={`text-xs p-2 rounded-lg mt-1 ${
                isSystem
                  ? "bg-purple-500/10 text-purple-300 italic text-center"
                  : m.sender === username
                  ? "bg-blue-500/20 text-white"
                  : "bg-white/5 text-gray-300"
              }`}>
                {m.message}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 pb-1 text-xs text-blue-300 italic shrink-0">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-white/10 px-3 py-3 flex items-center gap-2 shrink-0"
      >
        <input
          value={inputValue}
          onChange={handleTyping}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-40 transition-colors"
        >
          <Send size={15} className="text-white" />
        </button>
      </form>
    </div>
  );
}

// for getting the colors of each user 
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

//MAIN EDITOR PAGE
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
  const [sidebarTab, setSidebarTab] = useState("participants"); // "participants" | "chat"
  const [output, setOutput] = useState("// Output will appear here when you run your code...");
  const [language, setLanguage] = useState("javascript");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        await validateRoom(roomId);
      } catch (error) {
        navigate("/auth", { state: { from: `/editor/${roomId}` } });
      }
    };
    checkAccess();
  }, [roomId, navigate]);

  // Socket
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Connected to socket server with id: " + socketRef.current.id);
      console.log("Sending token:", localStorage.getItem("token"));
      socketRef.current.emit("join-room", {
        roomId,
        token: localStorage.getItem("token"),
      });
    });

    socketRef.current.on("participants-joined", (participants) => {
      console.log("Participants:", participants);
      setParticipants(participants);
    });

    socketRef.current.on("execution:queued", ({ triggeredBy, language }) => {
      setIsRunning(true);
      setOutput(`Running ${language}... (triggered by ${triggeredBy})`);
    });

    socketRef.current.on("execution:result", (data) => {
      console.log("execution:result received in this tab", data);
      const { stdout, stderr, status, executionTime, triggeredBy, language: resultLanguage } = data;
      setIsRunning(false);
      let result = "";
      if (stdout) result += stdout;
      if (stderr) result += `\n--- stderr ---\n${stderr}`;
      if (!stdout && !stderr) result = "// No output.";
      result += `\n\n--- ${status} | ${executionTime}ms | run by ${triggeredBy} ---`;
      setOutput(result);
    });

    socketRef.current.on("execution:rejected", ({ message }) => {
      setIsRunning(false);
      setOutput(`// ${message}`);
    });

    socketRef.current.on("execution:error", ({ message }) => {
      setIsRunning(false);
      setOutput(`// Error: ${message}`);
    });

    return () => socketRef.current.disconnect();
  }, [roomId]);

  // Yjs
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider("ws://localhost:1234", roomId, ydoc);
    providerRef.current = provider;

    provider.on("status", (e) => {
      console.log("Yjs status:", e.status);
    });

    const yText = ydoc.getText("monaco");
    const yLanguage = ydoc.getText("language");

    yLanguage.observe(() => {
      const lang = yLanguage.toString();
      if (lang) setLanguage(lang);
    });

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
      if (yLanguage.length === 0) {
        yLanguage.insert(0, "javascript");
      }
    });

    return () => {
      bindingRef.current?.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  // Fetch languages from the backend
  useEffect(() => {
    fetch("http://localhost:5000/api/execution/languages")
      .then((res) => res.json())
      .then((data) => {
        setLanguages(data);
        if (data.length > 0) setLanguage(data[0].key);
      })
      .catch((err) => console.error("Failed to fetch languages:", err));
  }, []);

  //Handlers what happens when a button is clicked
  const handleCopyId = () => {
    const fullLink = `${window.location.origin}/editor/${roomId}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = async () => {
    try {
      if (socketRef.current) socketRef.current.disconnect();
      navigate("/rooms");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const runCode = () => {
    console.log("runCode called");
    console.log("socket:", socketRef.current?.id);
    console.log("isRunning:", isRunning);
    if (!socketRef.current || isRunning) return;
    const code = ydocRef.current?.getText("monaco").toString();
    if (!code || code.trim().length === 0) {
      setOutput("// Nothing to run.");
      return;
    }
    socketRef.current.emit("execution:request", { roomId, language, code, stdin: "" });
  };

  const isError =
    output.includes("Error") ||
    output.includes("stderr") ||
    output.includes("runtime_error") ||
    output.includes("compile_error");

  //Render
  return (
    <div className="min-h-screen md:h-screen bg-slate-950 text-white flex flex-col overflow-hidden">

      {/* Nav bar in the editor page */}
      <div className="h-16 bg-white/5 border-b border-white/10 shrink-0 backdrop-blur-sm">
        <div className="px-6 max-w-full mx-auto">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={logo} className="w-6 h-6 rounded-full" />
              <div className="font-bold text-lg">
                <span className="text-white">Co</span>
                <span className="text-blue-400">Dev</span>
              </div>
            </div>

            {/* Room ID */}
            <div className="md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-400">Room ID:</span>
              <code className="text-sm font-mono text-blue-400">{roomId}</code>
              <button onClick={handleCopyId} className="p-1 hover:bg-white/10 rounded">
                {copied
                  ? <Check size={16} className="text-green-400" />
                  : <Copy size={16} className="text-gray-400" />
                }
              </button>
            </div>

            {/* Leave Button */}
            <button
              onClick={handleLeaveRoom}
              className="px-2 py-2 md:px-4 py-2 bg-red-700 hover:bg-red-900 border border-red-600 rounded-lg text-sm"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:px-6 md:py-3 gap-3 min-h-0 items-stretch">

        {/* ── LEFT: Editor + Output ── */}
        <div className="flex-none h-[calc(100vh-80px)] md:flex-1 flex flex-col min-w-0 bg-white/5 border border-white/10 rounded-xl overflow-hidden">

          {/* Editor toolbar — Language dropdown left, Run button right */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">Code Editor</span>
            </div>

            {/* Language selector + Run button grouped together */}
            <div className="flex items-center gap-2">

              {/* Language Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <span className="text-gray-300 text-sm">
                    {languages.find((l) => l.key === language)?.label ?? language}
                  </span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                {isLanguageDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-white/10 rounded-lg shadow-2xl py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => {
                          const yLanguage = ydocRef.current?.getText("language");
                          if (yLanguage) {
                            yLanguage.delete(0, yLanguage.length);
                            yLanguage.insert(0, lang.key);
                          }
                          setLanguage(lang.key);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${
                          language === lang.key ? "text-blue-400 bg-white/5" : "text-gray-300"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Run Button */}
              <button
                onClick={runCode}
                disabled={isRunning}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                  isRunning ? "bg-gray-600 cursor-not-allowed" : "bg-green-500 hover:bg-green-700"
                }`}
              >
                {isRunning ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    Run Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monaco + Output — vertical split */}
          <Split
            direction="vertical"
            sizes={[72, 28]}
            minSize={80}
            gutterSize={5}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Monaco Editor */}
            <div className="min-h-0">
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

                  const model = editor.getModel();
                  model.setEOL(monaco.editor.EndOfLineSequence.LF);
                  const yText = ydoc.getText("monaco");
                  const color = getColorForUser(currentUsername);

                  provider.awareness.setLocalStateField("user", { name: currentUsername, color });

                  bindingRef.current = new MonacoBinding(
                    yText,
                    model,
                    new Set([editor]),
                    provider.awareness
                  );

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
                        .yRemoteSelection-${clientId} { background-color: ${user.color}; }
                        .yRemoteSelectionHead-${clientId} { border-color: ${user.color}; background-color: ${user.color}; }
                        .yRemoteSelectionHead-${clientId}::after { content: "${user.name}"; background-color: ${user.color}; }
                      `;
                    });
                    styleEl.innerHTML = css;
                  };

                  provider.awareness.on("change", applyRemoteCursorStyles);
                  applyRemoteCursorStyles();
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
            <div className="flex-1 flex flex-col bg-black/40 min-h-0 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 shrink-0 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Output
                  </span>
                </div>
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">Console</span>
              </div>
              <pre
                className={`flex-1 overflow-y-auto max-h-full px-4 py-3 text-xs font-mono whitespace-pre-wrap ${
                  isError ? "text-red-400 bg-red-900/10" : output.startsWith("//") ? "text-gray-500 italic" : "text-green-400"
                }`}
                style={{ maxHeight:'100%' }}
              >
                {output}
              </pre>
            </div>
          </Split>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="w-full md:w-72 h-[500px] shrink-0 flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden">

          {/* Tab switcher — matches reference screenshot style */}
          <div className="relative flex p-1 bg-white/5 mx-3 mt-3 rounded-xl shrink-0 overflow-hidden">
           {/* The sliding background */}
           <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-blue-500 rounded-lg transition-transform duration-300 ease-in-out shadow-lg ${
            sidebarTab ==="chat" ? "translate-x-full" : "translate-x-0"
           }`}/>

           {/* Button 1: Participants */}
           <button onClick={() => setSidebarTab("participants")}
            className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300 ${
              sidebarTab === "participants" ? "text-white" : "text-gray-400 hover:text-gray-200"
            }`}>
            Participants
           </button>

           {/* Button 2:Chat */}
           <button onClick={() => setSidebarTab("chat")}
            className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300 ${
              sidebarTab === "chat" ? "text-white" : "text-gray-400 hover:text-gray-200"
            }`}>
              Chat
           </button>
          </div>

          {/* Participants panel */}
          {sidebarTab === "participants" && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">

              {/* Header row */}
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <Users size={15} />
                  <span className="text-sm font-medium text-white">Participants</span>
                </div>
                {participants.length > 0 && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    {participants.length}
                  </span>
                )}
              </div>

              {participants.length === 0 ? (
                <p className="text-xs text-gray-500 text-center mt-6">
                  Waiting for others to join…
                </p>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.socketId}
                    className="flex items-center gap-3 bg-white/5 p-3 rounded-lg"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {participant.username === currentUsername ? "You" : participant.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {participant.role === "host" ? "Host" : "Participant"}
                      </p>
                    </div>
                    {/* Green dot — matches reference screenshot */}
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Chat panel */}
          {sidebarTab === "chat" && (
            <ChatPanel
              socket={socketRef.current}
              roomId={roomId}
              username={currentUsername}
            />
          )}
        </div>
      </div>
    </div>
  );
}