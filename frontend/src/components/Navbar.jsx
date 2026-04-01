import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const isDashboard = location.pathname.includes('dashboard');
    const isLanding = location.pathname === '/';

    if (isDashboard || isLanding) return null;

    return (
        <nav className="fixed top-0 w-full bg-[#F5EDE4]/90 backdrop-blur-md border-b border-[#111111]/10 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-lg md:text-2xl font-bold tracking-tight text-[#111111]">
                                Aletheia
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link to="/" className="text-[#6B6B6B] hover:text-[#111111] px-3 py-2 rounded-md font-medium transition-colors">Home</Link>
                            <Link to="/about" className="text-[#6B6B6B] hover:text-[#111111] px-3 py-2 rounded-md font-medium transition-colors">About Us</Link>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login">
                            <button className="btn-outline text-sm rounded-sm px-4 py-2">Log in</button>
                        </Link>
                        <Link to="/signup">
                            <button className="btn-primary text-sm rounded-sm px-4 py-2">Get Started</button>
                        </Link>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F5EDE4] focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-[#F5EDE4] border-t border-[#111111]/10">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-[#111111] hover:bg-white">Home</Link>
                        <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-[#111111] hover:bg-white">About Us</Link>
                    </div>
                    <div className="pt-4 pb-4 border-t border-[#111111]/10">
                        <div className="flex items-center px-5 gap-4">
                            <Link to="/login" className="w-full"><button className="btn-outline w-full text-sm rounded-sm py-2">Log in</button></Link>
                            <Link to="/signup" className="w-full"><button className="btn-primary w-full text-sm rounded-sm py-2">Get Started</button></Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
