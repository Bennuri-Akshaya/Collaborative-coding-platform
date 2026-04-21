// const pty = require("node-pty");
// const path = require("path");
// const os = require("os");
// const fs = require("fs");
// const { randomUUID } = require("crypto");
// const { LANGUAGES } = require("../config/languages");

// const activeTerminals = new Map();
// const MAX_TERMINALS = 5;

// const { execSync } = require("child_process");

// function isDockerAvailable(){
//   try{
//     execSync("docker --version");
//     return true;
//   }catch{
//     return false;
//   }
// }

// function startTerminal(io, socket, roomId, language, code) {
//   //limit concurrent terminals
//   if (activeTerminals.size >= MAX_TERMINALS) {
//     socket.emit("terminal:output", "Server busy. Try later.\n");
//     return;
//   }
//   if(!isDockerAvailable()){
//     socket.emit("terminal:output","Docker not available on this server\n");
//     return;
//   }

//   //restart if already running
//   if (activeTerminals.has(roomId)) {
//     const old = activeTerminals.get(roomId);
//     old.kill();
//     activeTerminals.delete(roomId);
//   }

//   const lang = LANGUAGES[language];
//   if (!lang) {
//     socket.emit("terminal:output", "Unsupported language\n");
//     return;
//   }

//   if(code.length > 50000){
//     socket.emit("terminal:output","Code too large\n");
//     return;
//   }

//   const jobId = randomUUID();
//   const tmpDir = path.join(os.tmpdir(), `pty_${jobId}`);
//   fs.mkdirSync(tmpDir, { recursive: true });

//   const filePath = path.join(tmpDir, lang.filename);
//   fs.writeFileSync(filePath, code);

//   const normalizedDir = tmpDir
//   .replace(/\\/g, "/")
//   .replace(/^([A-Z]):/, (_, d) => `/${d.toLowerCase()}`);

//   //Docker command per language
//   let dockerCmd = "";

//   if (language === "python") {
//     dockerCmd = `docker run --rm -it --memory=128m --cpus=0.5 --pids-limit=64 --network=none --read-only --tmpfs /tmp:exec -v "${normalizedDir}:/code" python:3.11 python -u /code/${lang.filename}`;
//   } else if (language === "javascript") {
//     dockerCmd = `docker run --rm -it --memory=128m --cpus=0.5 --pids-limit=64 --network=none --read-only --tmpfs /tmp:exec -v "${normalizedDir}:/code" node:18 node /code/${lang.filename}`;
//   } else if (language === "java") {
//     dockerCmd = `docker run --rm -it --memory=128m --cpus=0.5 --pids-limit=64 --network=none --read-only --tmpfs /tmp:exec -v "${normalizedDir}:/code" eclipse-temurin:21-jdk sh -c "javac /code/${lang.filename} -d /tmp && java -cp /tmp Main"`;
//   } else if (language === "cpp") {
//     dockerCmd = `docker run --rm -it --memory=128m --cpus=0.5 --pids-limit=64 --network=none --read-only --tmpfs /tmp:exec  -v "${normalizedDir}:/code" gcc:13 sh -c "g++ /code/${lang.filename} -o /tmp/a && /tmp/a"`;
//   } else if (language === "c") {
//     dockerCmd = `docker run --rm -it --memory=128m --cpus=0.5 --pids-limit=64 --network=none --read-only --tmpfs /tmp:exec -v "${normalizedDir}:/code" gcc:13 sh -c "gcc /code/${lang.filename} -o /tmp/a && /tmp/a"`;
//   }

//   //spawn terminal
//   const shell = process.platform === "win32" ? "cmd.exe" : "bash";

//   const ptyProcess = pty.spawn(shell, [], {
//     name: "xterm-color",
//     cwd: tmpDir,
//     env: process.env,
//   });

//   activeTerminals.set(roomId, ptyProcess);

//   const MAX_EXEC_TIME = 60000;

//   setTimeout(() => {
//     if(activeTerminals.has(roomId)){
//       const term = activeTerminals.get(roomId);
//       term.kill();
//       activeTerminals.delete(roomId);

//       io.to(roomId).emit(
//         "terminal:output",
//         "\n Execution timed out (60s limit) \n" 
//       );
//     }
//   }, MAX_EXEC_TIME);

//   //output
//   ptyProcess.onData((data) => {
//     console.log("PTY OUTPUT:",data);
//     io.to(roomId).emit("terminal:output", data);
//   });

//   //cleanup on exit
//   ptyProcess.onExit(() => {
//     activeTerminals.delete(roomId);
//     console.log(`Terminal exited for room ${roomId}`);
//   });

//   // run docker command
//   setTimeout(() => {
//     ptyProcess.write(dockerCmd + "\r");
//   }, 200);
// }

// //input
// function handleInput(roomId, data) {
//   const term = activeTerminals.get(roomId);
//   if (term) {
//     term.write(data);
//   }
// }

// //stop manually
// function stopTerminal(roomId) {
//   const term = activeTerminals.get(roomId);
//   if (term) {
//     term.kill();
//     activeTerminals.delete(roomId);
//     console.log(`Terminal stopped for room ${roomId}`);
//   }
// }

// module.exports = { startTerminal, handleInput, stopTerminal };

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