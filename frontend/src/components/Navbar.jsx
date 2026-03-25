import { Menu,X } from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/logo.png';

export default function Navbar() {
    const [mobileMenuisOpen, setMobileMenuIsOpen] = useState(false);
    return (
        <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-slate-950/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
                    <div className="flex items-center space-x-1 group cursor-pointer">
                    <div>
                        <img src={logo} alt="CoDev" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
                    </div>
                    <span className="text-lg sm:text-xl md:text-2xl font-medium">
                        <span className="text-white">Co</span>
                        <span className="text-blue-400">Dev</span>
                    </span>
                    </div>
                        {/* Nav links */}
                    <div className=" hidden md:flex items-center space-x-6 lg:space-x-8">
                        <a href="#features" className="text-gray-300 hover:text-white text-sm lg:text-base">Features</a>
                        <a href="#how-it-works" className="text-gray-300 hover:text-white text-sm lg:text-base">How It Works</a>
                        <a href="#testimonials" className="text-gray-300 hover:text-white text-sm lg:text-base">Testimonals</a>
                    </div>
                    <button className="md:hidden items-center p-2 text-gray-300" onClick={()=>setMobileMenuIsOpen((prev)=>!prev)}>
                        {mobileMenuisOpen ? (
                            <X className="w-5 h-5 sm:w-6 sm:h-6"/>
                        ):(
                        <Menu className="w-5 h-5 sm:w-6 sm:h-6"/>
                        )}
                    </button>

                </div>
            </div>
            {mobileMenuisOpen && (
                <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 animate-in slide-in-from-top duration-300 ease-out">
                    <div className="px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                        <a href="#features" onClick={()=>setMobileMenuIsOpen(false)} className="block text-gray-300 hover:text-white text-sm lg:text-base px-2 py-2">Features</a>
                        <a href="#pricing" onClick={()=>setMobileMenuIsOpen(false)} className="block text-gray-300 hover:text-white text-sm lg:text-base px-2 py-2">Pricing</a>
                        <a href="#Testimonals" onClick={()=>setMobileMenuIsOpen(false)} className="block text-gray-300 hover:text-white text-sm lg:text-base px-2 py-2">Testimonals</a></div>
                </div>
            )}
        </nav>
    
    )
}