const pty = require("node-pty");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { randomUUID } = require("crypto");
const { LANGUAGES } = require("../config/languages");

const activeTerminals = new Map();
const MAX_TERMINALS = 5;

function startTerminal(io, socket, roomId, language, code) {
  //limit concurrent terminals
  if (activeTerminals.size >= MAX_TERMINALS) {
    socket.emit("terminal:output", "Server busy. Try later.\n");
    return;
  }
  //restart if already running
  if (activeTerminals.has(roomId)) {
    const old = activeTerminals.get(roomId);
    old.kill();
    activeTerminals.delete(roomId);
  }

  const lang = LANGUAGES[language];
  if (!lang) {
    socket.emit("terminal:output", "Unsupported language\n");
    return;
  }

  const jobId = randomUUID();
  const tmpDir = path.join(os.tmpdir(), `pty_${jobId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, lang.filename);
  fs.writeFileSync(filePath, code);

  // 1. Define Docker Arguments as an Array (Cleaner than string)
  // We use 'docker' as the command directly, NOT 'bash'
  let dockerArgs = [];
  const commonArgs = [
    "run", "--rm", "-i", // -i is crucial for interactive input
    "--memory=128m", "--cpus=0.5", "--pids-limit=64",
    "--network=none", "--read-only",
    "--tmpfs", "/tmp:exec",
    "-v", `${tmpDir}:/code`
  ];

  if (language === "python") {
    dockerArgs = [...commonArgs, "python:3.11", "python", `/code/${lang.filename}`];
  } else if (language === "javascript") {
    dockerArgs = [...commonArgs, "node:18", "node", `/code/${lang.filename}`];
  } else if (language === "java") {
    // For Java, we need a shell command inside docker to compile and run
    dockerArgs = [...commonArgs, "eclipse-temurin:21-jdk", "sh", "-c", `javac /code/${lang.filename} -d /tmp && java -cp /tmp Main`];
  } else if (language === "cpp") {
    dockerArgs = [...commonArgs, "gcc:13", "sh", "-c", `g++ /code/${lang.filename} -o /tmp/a && /tmp/a`];
  } else if (language === "c") {
    dockerArgs = [...commonArgs, "gcc:13", "sh", "-c", `gcc /code/${lang.filename} -o /tmp/a && /tmp/a`];
  }

  // 2. Spawn Docker DIRECTLY
  // This ensures that when docker exits, the PTY exits.
  const ptyProcess = pty.spawn("docker", dockerArgs, {
    name: "xterm-color",
    cwd: tmpDir,
    env: process.env,
  });

  activeTerminals.set(roomId, ptyProcess);

  const MAX_EXEC_TIME = 60000;

  const timeout = setTimeout(() => {
    if(activeTerminals.has(roomId)){
      const term = activeTerminals.get(roomId);
      term.kill(); // This kills the docker process directly
      activeTerminals.delete(roomId);
      io.to(roomId).emit("terminal:output", "\n Execution timed out (60s limit) \n");
    }
  }, MAX_EXEC_TIME);

  // 3. Output handling
  ptyProcess.onData((data) => {
    io.to(roomId).emit("terminal:output", data);
  });

  // 4. Cleanup on exit (This now triggers properly!)
  ptyProcess.onExit(() => {
    clearTimeout(timeout); // Clear the timeout if it finishes naturally
    activeTerminals.delete(roomId);
    console.log(`Terminal exited for room ${roomId}`);

    // 5. DELETE TEMP FILES
    fs.rm(tmpDir, { recursive: true, force: true }, (err) => {
      if (err) console.error("Failed to cleanup temp dir:", err);
      else console.log(`Cleaned up temp dir: ${tmpDir}`);
    });
  });
}

//input
function handleInput(roomId, data) {
  const term = activeTerminals.get(roomId);
  if (term) {
    term.write(data);
  }
}

//stop manually
function stopTerminal(roomId) {
  const term = activeTerminals.get(roomId);
  if (term) {
    term.kill();
    activeTerminals.delete(roomId);
    console.log(`Terminal stopped for room ${roomId}`);
  }
}

module.exports = { startTerminal, handleInput, stopTerminal };