// Run from backend root: node test-executor.js
//Testing if code execution via containers is happening
const { pullImages } = require("./execution/startup.js")
const { executeCode } = require("./execution/executor.js");

const TEST_CASES = [
//   {
//     label: "Python — basic output",
//     language: "python",
//     code: `print("Hello from Python")`,
//     stdin: "",
//   },
//   {
//     label: "Python — reads stdin",
//     language: "python",
//     code: `name = input()\nprint(f"Hello, {name}!")`,
//     stdin: "Ashwin",
//   },
//   {
//     label: "JavaScript — basic output",
//     language: "javascript",
//     code: `console.log("Hello from JavaScript")`,
//     stdin: "",
//   },
//   {
//     label: "C++ — basic output",
//     language: "cpp",
//     code: `#include<iostream>\nint main(){\nstd::cout<<"Hello from C++"<<std::endl;\nreturn 0;\n}`,
//     stdin: "",
//   },
//   {
//     label: "C — basic output",
//     language: "c",
//     code: `#include<stdio.h>\nint main(){\nprintf("Hello from C\\n");\nreturn 0;\n}`,
//     stdin: "",
//   },
//   {
//     label: "Java — basic output",
//     language: "java",
//     code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Java");\n  }\n}`,
//     stdin: "",
//   },
//   {
//     label: "Python — infinite loop (should TLE)",
//     language: "python",
//     code: `while True: pass`,
//     stdin: "",
//   },
//   {
//     label: "Python — compile error",
//     language: "python",
//     code: `def broken(\nprint("oops")`,
//     stdin: "",
//   },
  {
  label: "C++ — reads stdin",
  language: "cpp",
  code: `#include<iostream>\nint main(){\nstd::string name;\nstd::cin >> name;\nstd::cout << "Hello, " << name << std::endl;\nreturn 0;\n}`,
  stdin: "Ashwin",
},
{
  label: "Java — reads stdin",
  language: "java",
  code: `import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String name = sc.nextLine();\n    System.out.println("Hello, " + name);\n  }\n}`,
  stdin: "Ashwin",
},
{
  label: "C++ — compile error",
  language: "cpp",
  code: `#include<iostream>\nint main(){\nstd::cout << "missing semicolon"\nreturn 0;\n}`,
  stdin: "",
},
{
  label: "Java — compile error",
  language: "java",
  code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("missing semicolon")\n  }\n}`,
  stdin: "",
},
{
  label: "C++ — runtime error (segfault)",
  language: "cpp",
  code: `#include<iostream>\nint main(){\nint* p = nullptr;\nstd::cout << *p;\nreturn 0;\n}`,
  stdin: "",
},
{
  label: "Python — large output (output cap test)",
  language: "python",
  code: `for i in range(100000):\n    print(i)`,
  stdin: "",
},
{
  label: "Javascript — reads stdin",
  language: "javascript",
  code: `const fs = require('fs');\nconst input = fs.readFileSync('/code/stdin.txt','utf8').trim();\nconsole.log('Hello,', input);`,
  stdin: "Ashwin",
},
];

async function runTests() {
  for (const test of TEST_CASES) {
    console.log(`\n── ${test.label} ──`);
    try {
      const result = await executeCode(test.language, test.code, test.stdin);
      console.log("status:", result.status);
      console.log("stdout:", JSON.stringify(result.stdout));
      console.log("stderr:", JSON.stringify(result.stderr));
      console.log("time:  ", result.executionTime + "ms");
    } catch (err) {
      console.error("THREW:", err.message);
    }
  }
}

async function main(){
    await pullImages();
    await runTests();

}

main();