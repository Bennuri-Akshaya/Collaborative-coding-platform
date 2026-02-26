const testimonals = [
  {
    name: "Aarav Patel",
    role: "Frontend Developer",
    content:
      "CoDev completely changed how our team collaborates. Real-time editing feels smooth and effortless!",
    image: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Sarah Johnson",
    role: "Software Engineer",
    content:
      "The live rooms and presence indicators make remote teamwork feel natural. It’s now our daily tool.",
    image: "https://i.pravatar.cc/150?img=32",
  },
  {
    name: "Michael Lee",
    role: "Team Lead",
    content:
      "Managing collaborative sessions has never been easier. CoDev boosts productivity across every project.",
    image: "https://i.pravatar.cc/150?img=45",
  },
];


export default function Testimonials() {
    return (
        <div>
            <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
           <div className="max-w-7xl mx-auto">
        
        {/* Heading */}
        <div className="flex flex-col lg:flex-row items-start gap-8 sm:gap-12 lg:gap-16">
        <div className="lg:w-1/2 w-full text-center lg:text-left">
          <h2 className="text-5xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">What Our </span>
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"> Users </span>
            <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">Say?</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Discover how CoDev makes collaboration easier, faster, and more enjoyable.
          </p>
        </div>
        {/* Testimonials right side */}
        <div className="lg:w-1/2 w-full grid gap-6 sm:gap-8">
        <div>
            {testimonals.map((testimonal, key) => (
                <div key={key} className="bg-slate-900/50 p-4 sm:p-6 backdrop-blur-sm border border-slate-800 rounded-xl sm:rounded-xl mb-6">
                  <p className="text-gray-300 mb-4">{testimonal.content}</p>
                  <div className="flex items-start space-x-3 sm:">
                    <img src={testimonal.image} alt={testimonal.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold text-white">{testimonal.name}</p>
                      <p className="text-sm text-gray-400">{testimonal.role}</p>
                    </div>
                  </div>
                </div>
            ))}
        </div>
    
        </div>
        </div>
       </div>
        </section>
        </div>
    )
}