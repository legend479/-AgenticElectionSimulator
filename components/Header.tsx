
import React, { useState, useEffect } from 'react';
import ThinkerIcon from './ui/ThinkerIcon';
import { LayoutDashboard, LineChart, BookOpen, ChevronDown, Cpu, Activity, Zap, Info, Menu, X } from 'lucide-react';
import { cn } from '../services/utils';

const Header: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
        e.preventDefault();
        window.location.hash = hash;
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const navItems = [
        { name: 'Simulator', hash: 'simulator', icon: <LayoutDashboard className="h-4 w-4" /> },
        { name: 'Analysis', hash: 'model-tuner', icon: <LineChart className="h-4 w-4" /> },
        { name: 'Docs', hash: 'documentation', icon: <BookOpen className="h-4 w-4" /> },
    ];

    const modelItems = [
        { name: 'Extended Utility', hash: 'utility-model', icon: <Activity className="w-4 h-4" />, color: 'sky', desc: 'Rational choice & social norms' },
        { name: 'Drift-Diffusion', hash: 'ddm-model', icon: <Zap className="w-4 h-4" />, color: 'purple', desc: 'Stochastic evidence accumulation' },
        { name: 'Dual-System', hash: 'dual-system-model', icon: <Cpu className="w-4 h-4" />, color: 'indigo', desc: 'Intuition vs. Deliberation' },
    ];

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
            scrolled 
                ? "bg-slate-950/90 backdrop-blur-xl border-slate-800/80 py-3" 
                : "bg-transparent border-transparent py-5"
        )}>
            <div className="container mx-auto flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 p-2 sm:p-2.5 border border-sky-400/30 flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <ThinkerIcon className="text-white w-full h-full" />
                    </div>
                    <div className="flex flex-col">
                      <a 
                        href="#simulator" 
                        onClick={(e) => handleNavClick(e, 'simulator')}
                        className="text-base sm:text-lg font-black text-white tracking-tight hover:text-sky-400 transition-colors"
                      >
                        #ToVote <span className="text-slate-500 font-medium">OrNot</span>
                      </a>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Agentic Election Simulator</span>
                    </div>
                </div>
                
                {/* Desktop Navigation */}
                <nav className="hidden lg:block">
                    <ul className="flex items-center space-x-1 text-sm font-bold">
                        {navItems.map((item) => (
                            <li key={item.hash}>
                                <a 
                                  href={`#${item.hash}`}
                                  onClick={(e) => handleNavClick(e, item.hash)} 
                                  className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </a>
                            </li>
                        ))}
                        
                        <li className="relative">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={cn(
                                  "text-slate-400 hover:text-white hover:bg-slate-800/50 px-4 py-2 rounded-lg transition-all flex items-center gap-2",
                                  isDropdownOpen && "bg-slate-800/50 text-white"
                                )}
                            >
                                <Cpu className="h-4 w-4" />
                                <span>Model Theory</span>
                                <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                            </button>
                            {isDropdownOpen && (
                                <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                                <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-3 z-50 animate-slide-up backdrop-blur-xl">
                                    <div className="px-5 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Behavioral Frameworks</div>
                                    {modelItems.map((item) => (
                                        <a 
                                            key={item.hash}
                                            href={`#${item.hash}`} 
                                            onClick={(e) => handleNavClick(e, item.hash)} 
                                            className={cn(
                                                "flex items-center gap-3 px-5 py-3 text-sm text-slate-300 transition-all",
                                                item.color === 'sky' ? "hover:bg-sky-500/10 hover:text-sky-400" :
                                                item.color === 'purple' ? "hover:bg-purple-500/10 hover:text-purple-400" :
                                                "hover:bg-indigo-500/10 hover:text-indigo-400"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                item.color === 'sky' ? "bg-sky-500/10 text-sky-500" :
                                                item.color === 'purple' ? "bg-purple-500/10 text-purple-500" :
                                                "bg-indigo-500/10 text-indigo-500"
                                            )}>
                                              {item.icon}
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="font-bold">{item.name}</span>
                                              <span className="text-[10px] text-slate-500">{item.desc}</span>
                                            </div>
                                        </a>
                                    ))}
                                    <div className="border-t border-slate-800/50 my-2 mx-5"></div>
                                    <a href="#parameters-explained" onClick={(e) => handleNavClick(e, 'parameters-explained')} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                          <Info className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="font-bold">Parameter Guide</span>
                                          <span className="text-[10px] text-slate-500">Deep dive into model variables</span>
                                        </div>
                                    </a>
                                </div>
                                </>
                            )}
                        </li>
                    </ul>
                </nav>

                {/* Mobile Menu Button */}
                <div className="lg:hidden flex items-center gap-2">
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>
            </div>

            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 top-20 bg-slate-950 z-50 animate-fade-in overflow-y-auto">
                    <div className="p-6 space-y-8">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Main Navigation</p>
                            <div className="grid grid-cols-1 gap-2">
                                {navItems.map((item) => (
                                    <a 
                                        key={item.hash}
                                        href={`#${item.hash}`}
                                        onClick={(e) => handleNavClick(e, item.hash)}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-sky-500/50 transition-all"
                                    >
                                        <div className="text-sky-500">{item.icon}</div>
                                        <span className="font-bold">{item.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Model Theory</p>
                            <div className="grid grid-cols-1 gap-2">
                                {modelItems.map((item) => (
                                    <a 
                                        key={item.hash}
                                        href={`#${item.hash}`}
                                        onClick={(e) => handleNavClick(e, item.hash)}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-sky-500/50 transition-all"
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            item.color === 'sky' ? "bg-sky-500/10 text-sky-500" :
                                            item.color === 'purple' ? "bg-purple-500/10 text-purple-500" :
                                            "bg-indigo-500/10 text-indigo-500"
                                        )}>
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{item.name}</span>
                                            <span className="text-xs text-slate-500">{item.desc}</span>
                                        </div>
                                    </a>
                                ))}
                                <a 
                                    href="#parameters-explained"
                                    onClick={(e) => handleNavClick(e, 'parameters-explained')}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-sky-500/50 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Parameter Guide</span>
                                        <span className="text-xs text-slate-500">Detailed variable reference</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
