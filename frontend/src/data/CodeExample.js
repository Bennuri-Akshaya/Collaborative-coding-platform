export const codeExample = {
    "index.js":`function fetchUser(id) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ id, name: "CoDev Developer" });
    }, 500);
  });
}

fetchUser(1).then(user => {
  console.log("User Loaded:", user.name);
});


`,
   "prog.py":`class Calculator:
    def add(self, a, b):
        return a + b

calc = Calculator()
result = calc.add(10, 15)

print("Calculation Complete!")
print("Result:", result)




`


}

export const floatingCards={
    "index.js":{
        bgColor:"bg-blue-500/20",
        iconColor:"text-blue-400",
        textColor:"text-blue-200",
        contentColor:"text-blue-300",
        icon:"💻",
        title:"Real-Time Collaboration",
        content:"Edit code together instantly with your team. See changes live as they happen.",
    },
    "prog.py":{
        bgColor:"bg-purple-500/20",
        iconColor:"text-purple-400",
        textColor:"text-purple-200",
        contentColor:"text-purple-300",
        icon:"🔑",
        title:"Create & Join Rooms",
        content:"Start a coding room in one click.Invite teammates and build together.",
    }

}