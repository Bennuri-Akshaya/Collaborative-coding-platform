const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { randomUUID } = require("crypto");
const { LANGUAGES } = require("../config/languages");

const docker = new Docker({ socketPath: "//./pipe/docker_engine" });

const EXECUTION_TIMEOUT_MS = 10000;

async function executeCode(languageKey, sourceCode, stdin = "") {
  const lang = LANGUAGES[languageKey];
  if (!lang) throw new Error(`Unsupported language: ${languageKey}`);

  // 1. Write source code and stdin to temp directory
  const jobId = randomUUID();
  const tmpDir = path.join(os.tmpdir(), `exec_${jobId}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, lang.filename), sourceCode);
  fs.writeFileSync(path.join(tmpDir, "stdin.txt"), stdin); // stdin as file

  // Windows path → Linux path for Docker bind mount
  // C:\Users\... → /c/Users/... (Docker Desktop on Windows uses this format)
  const normalizedDir = tmpDir.replace(/\\/g, "/").replace(/^([A-Z]):/, (_, d) => `/${d.toLowerCase()}`);
  const binds = [`${normalizedDir}:/code:ro`];

  const startTime = Date.now();
  let container;

  try {
    container = await docker.createContainer({
      Image: lang.image,
      Cmd: lang.runCmd,
      AttachStdout: true,
      AttachStderr: true,
      NetworkDisabled: true,
      User:"nobody",
      HostConfig: {
        Binds: binds,
        Memory: 128 * 1024 * 1024,
        MemorySwap: 128 * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: 50000,
        PidsLimit: 50,
        ReadonlyRootfs: true,
        Tmpfs: { "/tmp": "size=10m,exec" },  // writable /tmp for compiled binaries
        AutoRemove: false,
      },
    });

    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
      stdin:true
    });

    const stdoutChunks = [];
    const stderrChunks = [];

    docker.modem.demuxStream(
      stream,
      { write: (chunk) => stdoutChunks.push(chunk) },
      { write: (chunk) => stderrChunks.push(chunk) },
    );

    await container.start();

    // Wait for exit with timeout
    const exitCode = await Promise.race([
      container.wait().then((res) => res.StatusCode),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), EXECUTION_TIMEOUT_MS)
      ),
    ]);

    const stdout = Buffer.concat(stdoutChunks).toString("utf8");
    const stderr = Buffer.concat(stderrChunks).toString("utf8");
    const executionTime = Date.now() - startTime;

    // Non-zero exit with stderr = compile error or runtime error
    // Differentiate by checking if stderr contains compiler-specific messages
    let status;
    if (exitCode === 0) {
      status = "success";
    } else if (isCompileError(languageKey, stderr)) {
      status = "compile_error";
    } else {
      status = "runtime_error";
    }

    return {
      stdout: stdout.slice(0, 100000),
      stderr: stderr.slice(0, 10000),
      status,
      exitCode,
      executionTime,
    };

  } catch (err) {
    if (err.message === "TIMEOUT") {
      // Force kill the container on timeout
      if (container) {
        await container.kill().catch(() => {});
        await container.remove({ force: true }).catch(() => {});
      }
      return {
        stdout: "",
        stderr: "Time Limit Exceeded (10s)",
        status: "tle",
        exitCode: null,
        executionTime: EXECUTION_TIMEOUT_MS,
      };
    }
  } finally {
    // Always cleanup container and temp directory
    if (container) {
      await container.remove({ force: true }).catch(() => {});
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// Detect compile errors vs runtime errors by language
function isCompileError(languageKey, stderr) {
  const patterns = {
    cpp:  /error:/i,
    c:    /error:/i,
    java: /error:/i,
  };
  return patterns[languageKey]
    ? patterns[languageKey].test(stderr)
    : false;
}

module.exports = { executeCode };