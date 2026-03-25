import { ArrowRight, ChevronDown, CloudUpload, Sparkles } from 'lucide-react';
import { useState,useEffect } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { codeExample, floatingCards } from '../data/CodeExample';
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [activeTab, setActiveTab] = useState('index.js');
    useEffect(() => {
        function handleMouseMove(e) {
           setMousePosition({x:e.clientX, y:e.clientY});
        }
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    },[])
    const currentFloatingCard = floatingCards[activeTab];
    return (
        <section className="relative bg-slate-950 min-h-screen flex items-center justify-center pt-16 sm:pt-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(158, 182, 220, 0.15), transparent 40%)`,
        }}
      />
      <div className="absolute top-20 left-4 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-4 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-100" />
  {/* background part */}
<div className="max-w-7xl mx-auto text-center relative w-full">
    <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center lg:text-left gap-6 sm:gap-8 lg:gap-12 items-center relative">
        <div>
            <div className="inline-flex items-center space-x-2 px-3 sm:px-4 bg-blue-500/10 border border-blue-500/20 rounded-full mb-1 sm:mb-2 animate-in slide-in-from-bottom duration-700 ease-out">
                <Sparkles className="w-4 h-4 text-blue-400"/>
                <span className="text-xs sm:text-sm text-blue-300">Introducing CoDev</span>
            </div>
            <h1 className="text-5xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
                <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent block mb-1 sm:mb-2">Collaborate instantly,</span>
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent block mb-1 sm:mb-2">Code together</span>
                <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent block mb-1 sm:mb-2">With CoDev</span>
            </h1>
            <p className="text-md sm:text-base lg:text-lg text-gray-400 max-w-2xl mx-auto lg:mx-0 mb-4 sm:mb-4 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">Collaborate on code instantly with your team in real time. Create or join rooms, share ideas effortlessly, and build smarter together. CoDev makes collaboration seamless so you can stay focused and keep creating.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8 sm:mb-12 animate-in slide-in-from-bottom duration-700 delay-300">
            <button onClick={() => navigate('/auth')} className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-102 flex items-center justify-center space-x-2">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 sm:h-5 group-hover:translate-transform duration-300"/>
            </button>
        </div>
        </div>
    
  <div className="relative order-2 w-full">
    <div className="relative bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10">
      <div className="bg-gradient-to-br from-gray-900/20 to-gray-800/20 backdrop-blur-lg overflow-hidden h-[280px] sm:h-[350px] w-full border border-white/5">
                {/* IDE HEADER */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300">
                      CoDev
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                </div>
        <div className="p-3 sm:p-4 relative h-full">
        <div className="flex space-x-1 sm:space-x-2 sm:mb-4 overflow--x-auto">
            {/* File Tabs*/}
            <button onClick={()=>setActiveTab("index.js")}
             className={`px-3 py-2 backdrop-blur-sm text-xs sm:text-sm rounded-t-lg border ${activeTab === "index.js"?"bg-blue-500/30 text-white border-blue-400/20":"bg-white/5 text-gray-300 border-white/10 hover:bg-white/10" } transition duration-200 whitespace-nowrap`}>index.js</button>
            <button onClick={()=>setActiveTab("prog.py")}
             className={`px-3 py-2 backdrop-blur-sm text-xs sm:text-sm rounded-t-lg border ${activeTab === "prog.py"?"bg-blue-500/30 text-white border-blue-400/20":"bg-white/5 text-gray-300 border-white/10 hover:bg-white/10" }  transition duration-200 whitespace-nowrap`}>
                prog.py</button>
        </div>
        {/* Code content */}
        <div className="relative overflow-hidden flex-grow">
            <SyntaxHighlighter language='javascript' style={nightOwl} customStyle={{margin:0,borderRadius:"8px",fontSize:"11px",lineHeight:"1.4",height:"100%",border:"1px solid #3c3c3c"}}>
                {codeExample[activeTab]}
            </SyntaxHighlighter>

        </div>
        {/* Floating cards */}
        <div
  className={`hidden lg:block fixed bottom-4 right-4 transform translate-x-2 translate-y-2 w-72 ${floatingCards[activeTab].bgColor} backdrop-blur-xl rounded-lg p-4 border border-white/20 shadow-lg`}
>
  <div className="flex items-center space-x-2 mb-2">
    <div className={`w-6 h-6 ${currentFloatingCard.iconColor} flex items-center justify-center text-sm font-bold`}>
      {currentFloatingCard.icon}
    </div>
    <span>{currentFloatingCard.title}</span>
  </div>
  <div className={`text-sm text-left ${currentFloatingCard.contentColor}`}>
    {currentFloatingCard.content}
  </div>
</div>
      </div>
      </div>
    </div>
    </div>
    </div>
  </div>
</section>)
}