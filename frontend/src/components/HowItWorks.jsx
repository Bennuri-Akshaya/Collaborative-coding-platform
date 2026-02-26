import { Plus, Users, Zap } from "lucide-react";

const steps = [
  {
    icon: Plus,
    title: "Create a Room",
    description:
      "Set up a new collaborative space in seconds with custom settings and preferences.",
  },
  {
    icon: Users,
    title: "Invite Teammates",
    description:
      "Share the room link with your team members or copy and paste the invite code.",
  },
  {
    icon: Zap,
    title: "Code Together in Real Time",
    description:
      "Start collaborating instantly with live editing, presence detection, and seamless updates.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
              Start your,
            </span>{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Session
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Follow these quick steps to begin.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={index} className="relative flex items-center justify-center">
                {/* Card */}
                <div
                  className="relative group h-93 max-w-sm w-full p-6 bg-white/5 border border-white/10 rounded-xl 
                             overflow-hidden transition-all duration-300 max-w-sm
                             hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  {/* Hover gradient sweep*/}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-500
                               transform -translate-x-full -translate-y-full 
                               group-hover:translate-x-0 group-hover:translate-y-0 pointer-events-none"
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                      <Icon className="w-8 h-8 text-blue-400" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold mb-2">{step.title}</h3>

                    {/* Description */}
                    <p className="text-gray-400 max-w-xs leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow Line */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-1/2 -right-8 w-8 h-[2px] 
                               bg-blue-400/40 transform -translate-y-1/2"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
