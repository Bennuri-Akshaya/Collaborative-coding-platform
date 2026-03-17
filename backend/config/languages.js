const LANGUAGES = {
  python: {
    label: "Python 3.11",
    image: "python:3.11-slim",
    filename: "solution.py",
    compileCmd: null,
    // stdin handled via file redirect inside executor
    runCmd: ["sh", "-c", "python3 /code/solution.py < /code/stdin.txt"],
  },

  javascript: {
    label: "JavaScript (Node 18)",
    image: "node:18-slim",
    filename: "solution.js",
    compileCmd: null,
    runCmd: ["sh", "-c", "node /code/solution.js < /code/stdin.txt"],
  },

  java: {
    label: "Java 21",
    image: "eclipse-temurin:21-jdk-alpine",
    filename: "Main.java",
    compileCmd: null,   // handled as single combined command
    // compile to /tmp (writable tmpfs), then run from /tmp
    runCmd: ["sh", "-c", "javac /code/Main.java -d /tmp && java -cp /tmp Main < /code/stdin.txt"],
  },

  cpp: {
    label: "C++ (GCC 13)",
    image: "gcc:13",
    filename: "solution.cpp",
    compileCmd: null,   // handled as single combined command
    runCmd: ["sh", "-c", "g++ /code/solution.cpp -o /tmp/solution -O2 && /tmp/solution < /code/stdin.txt"],
  },

  c: {
    label: "C (GCC 13)",
    image: "gcc:13",
    filename: "solution.c",
    compileCmd: null,   // handled as single combined command
    runCmd: ["sh", "-c", "gcc /code/solution.c -o /tmp/solution && /tmp/solution < /code/stdin.txt"],
  },
};

const LANGUAGE_OPTIONS = Object.entries(LANGUAGES).map(([key, val]) => ({
  key,
  label: val.label,
}));

module.exports = { LANGUAGES, LANGUAGE_OPTIONS };