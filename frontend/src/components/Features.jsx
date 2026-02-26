import { Code2, Users, MessageSquare, Zap, Globe, Share2 } from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "Real-time Editing",
    description:
      "See changes instantly as your team writes code with synchronized updates across all connected editors.",
  },
  {
    icon: Users,
    title: "Live Cursors & Presence",
    description:
      "Know exactly where your teammates are with visible cursors and real-time presence indicators.",
  },
  {
    icon: MessageSquare,
    title: "Built-in Chat",
    description:
      "Discuss code and ideas without leaving the editor. Integrated messaging for seamless collaboration.",
  },
  {
    icon: Zap,
    title: "Code Snippets Library",
    description:
      "Save and organize frequently used code snippets. Access your collection instantly for faster development.",
  },
  {
    icon: Globe,
    title: "Multi-language Support",
    description:
      "Support for multiple programming languages with syntax highlighting and intelligent code completion.",
  },
  {
    icon: Share2,
    title: "One-click Sharing",
    description:
      "Generate shareable room links instantly. Invite teammates with custom permissions and access control.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">Build Better,</span>
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"> Together.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Empowering teams with tools that make coding faster, smoother, and truly collaborative.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-blue-400/40 hover:shadow-lg transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>

                {/* Description */}
                <p className="text-gray-400 text-base">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
