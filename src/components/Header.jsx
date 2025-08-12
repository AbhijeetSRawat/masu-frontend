import React, { useState } from 'react'
import Container from './Container'
import { IoMdMenu } from 'react-icons/io'
import { Link, useNavigate } from 'react-router'
import { FaLongArrowAltLeft, FaLongArrowAltRight } from 'react-icons/fa'
import { TiDeleteOutline } from 'react-icons/ti'

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState('');
    
    const toggleDropdown = (val) => {
        setDropdownOpen(dropdownOpen === val ? '' : val);
    };

    const navigate = useNavigate();

    return (
        <div className='bg-[#152354] text-[#fad98e] z-40 sticky top-0 left-0'>
            <div className="font-semibold">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center py-3">
                        {/* Logo */}
                        <a href="/">
                            <div>
                                <img width={160} className="lg:w-[200px]" src="/images/logo.jpeg" alt="Logo" />
                            </div>
                        </a>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden">
                            <button 
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-2xl p-2"
                            >
                                {mobileMenuOpen ? <TiDeleteOutline /> : <IoMdMenu />}
                            </button>
                        </div>

                        {/* Desktop Navigation */}
                        <div className='hidden lg:flex items-center gap-6'>
                            <a href="/"><div className="hover:text-white transition-colors">Home</div></a>
                            <Link to="/whyus"><div className="hover:text-white transition-colors">Why Us</div></Link>
                            
                            {/* Solutions Dropdown */}
                            <div className='relative'>
                                <div 
                                    className='cursor-pointer hover:text-white transition-colors' 
                                    onClick={() => toggleDropdown('solutions')}
                                >
                                    Solutions ▼
                                </div>
                                {dropdownOpen === 'solutions' && (
                                    <div className="absolute top-8 left-0 bg-[#152354] border border-[#fad98e] rounded shadow-lg p-3 min-w-[180px] z-50">
                                        <Link to="/forsmallbusiness">
                                            <div className='whitespace-nowrap py-2 hover:text-white transition-colors'>For Small Business</div>
                                        </Link>
                                        <Link to="/forenterprises">
                                            <div className='whitespace-nowrap py-2 hover:text-white transition-colors'>For Enterprises</div>
                                        </Link>
                                        <Link to="/forhrteams">
                                            <div className='whitespace-nowrap py-2 hover:text-white transition-colors'>For HR Teams</div>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Features Dropdown */}
                            <div className='relative'>
                                <div 
                                    className='cursor-pointer hover:text-white transition-colors' 
                                    onClick={() => toggleDropdown('features')}
                                >
                                    Features ▼
                                </div>
                                {dropdownOpen === 'features' && (
                                    <div className="absolute top-8 left-0 bg-[#152354] border border-[#fad98e] rounded shadow-lg p-3 min-w-[180px] z-50">
                                        <Link to="/payrollprocessing">
                                            <div className='whitespace-nowrap py-2 hover:text-white transition-colors'>Payroll Processing</div>
                                        </Link>
                                        <Link to="/taxcompliance">
                                            <div className='whitespace-nowrap py-2 hover:text-white transition-colors'>Tax Compliance</div>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Login Dropdown */}
                            <div className='relative'>
                                <div 
                                    className='cursor-pointer hover:text-white transition-colors' 
                                    onClick={() => toggleDropdown('login')}
                                >
                                    Login ▼
                                </div>
                                {dropdownOpen === 'login' && (
                                    <div className="absolute top-8 -left-5 bg-[#152354] border border-[#fad98e] rounded shadow-lg p-3 min-w-[120px] z-50">
                                        <div 
                                            className='whitespace-nowrap py-2 cursor-pointer hover:text-white transition-colors' 
                                            onClick={() => navigate('/login')}
                                        >
                                            Login
                                        </div>
                                    </div>
                                )}
                            </div>

                            <a href="/demo">
                                <button className='px-4 py-2 rounded border border-[#fad98e] hover:bg-[#fad98e] hover:text-[#152354] transition-colors'>
                                    Demo
                                </button>
                            </a>
                            <a href="/contactus">
                                <button className='px-4 py-2 rounded border border-[#fad98e] hover:bg-[#fad98e] hover:text-[#152354] transition-colors'>
                                    Contact Us
                                </button>
                            </a>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden bg-[#152354] border-t border-[#fad98e] py-4">
                            <div className="flex flex-col space-y-4">
                                <a href="/" className="block px-4 py-2 hover:bg-[#1a2a5e] rounded">Home</a>
                                <Link to="/whyus" className="block px-4 py-2 hover:bg-[#1a2a5e] rounded">Why Us</Link>
                                
                                {/* Mobile Solutions */}
                                <div>
                                    <div 
                                        className='px-4 py-2 cursor-pointer hover:bg-[#1a2a5e] rounded flex justify-between items-center' 
                                        onClick={() => toggleDropdown('mobile-solutions')}
                                    >
                                        Solutions
                                        <span>{dropdownOpen === 'mobile-solutions' ? '▲' : '▼'}</span>
                                    </div>
                                    {dropdownOpen === 'mobile-solutions' && (
                                        <div className="ml-4 mt-2 space-y-2">
                                            <Link to="/forsmallbusiness" className="block px-4 py-2 text-sm hover:bg-[#1a2a5e] rounded">For Small Business</Link>
                                            <Link to="/forenterprises" className="block px-4 py-2 text-sm hover:bg-[#1a2a5e] rounded">For Enterprises</Link>
                                            <Link to="/forhrteams" className="block px-4 py-2 text-sm hover:bg-[#1a2a5e] rounded">For HR Teams</Link>
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Features */}
                                <div>
                                    <div 
                                        className='px-4 py-2 cursor-pointer hover:bg-[#1a2a5e] rounded flex justify-between items-center' 
                                        onClick={() => toggleDropdown('mobile-features')}
                                    >
                                        Features
                                        <span>{dropdownOpen === 'mobile-features' ? '▲' : '▼'}</span>
                                    </div>
                                    {dropdownOpen === 'mobile-features' && (
                                        <div className="ml-4 mt-2 space-y-2">
                                            <Link to="/payrollprocessing" className="block px-4 py-2 text-sm hover:bg-[#1a2a5e] rounded">Payroll Processing</Link>
                                            <Link to="/taxcompliance" className="block px-4 py-2 text-sm hover:bg-[#1a2a5e] rounded">Tax Compliance</Link>
                                        </div>
                                    )}
                                </div>

                                <div 
                                    className="block px-4 py-2 hover:bg-[#1a2a5e] rounded cursor-pointer"
                                    onClick={() => navigate('/login')}
                                >
                                    Login
                                </div>

                                <a href="/demo" className="block px-4 py-2 hover:bg-[#1a2a5e] rounded">Demo</a>
                                <a href="/contactus" className="block px-4 py-2 hover:bg-[#1a2a5e] rounded">Contact Us</a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}