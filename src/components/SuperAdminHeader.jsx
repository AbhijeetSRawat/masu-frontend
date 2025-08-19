import logo from '../assets/images/WhatsApp Image 2025-06-30 at 16.52.32_498f8c48.jpg';
import React from 'react';

const SuperAdminHeader = () => {
  return (
    <div className='w-[100vw] flex justify-between items-center px-6 lg:px-8 py-4 min-h-[8vh] text-white bg-blue-950 shadow-2xl border-b-2 border-blue-800/50 lg:w-[80vw]'>
      {/* Left side - Super Admin Portal */}
      <div className="flex items-center">
        <div className="hidden lg:flex items-center">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold text-purple-100">Super Admin</span>
            <p className="text-sm text-purple-300 font-medium">MASTER CONTROL</p>
          </div>
        </div>
        {/* Mobile only - Super Admin badge */}
        <div className="lg:hidden flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mr-2 shadow-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-purple-100">Super Admin</span>
        </div>
      </div>

      {/* Center - MASU Consultancy Logo and Name */}
      <div className="flex items-center justify-center flex-1 lg:flex-none lg:absolute lg:left-7/12 lg:transform lg:-translate-x-1/2">
        <div className="flex items-center bg-white/15 backdrop-blur-md rounded-2xl px-6 py-3 border-2 border-purple-300/30 shadow-2xl">
          <img 
            src={logo} 
            alt="MASU Consultancy logo" 
            className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl mr-4 border-2 border-white/40 shadow-lg object-cover" 
          />
          <div className="text-center">
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-wide">
              MASU
              <span className="text-purple-200 ml-2">Consultancy</span>
            </h1>
            <p className="text-xs lg:text-sm text-purple-200 font-semibold tracking-widest">
              ENTERPRISE SOLUTIONS
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Super Admin Controls */}
      <div className="flex items-center space-x-3">
        {/* Global Settings */}
        <div className="relative">
          <button className="p-2 lg:p-3 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-200 border border-white/30 shadow-lg group">
            <svg className="h-5 w-5 lg:h-6 lg:w-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {/* Tooltip */}
          <div className="absolute -bottom-8 right-0 hidden lg:group-hover:block bg-black/80 text-xs text-white px-2 py-1 rounded whitespace-nowrap">
            Global Settings
          </div>
        </div>

        {/* Super Admin Profile */}
        <div className="flex items-center bg-white/15 backdrop-blur-md rounded-xl px-3 py-2 border border-white/30 shadow-lg">
          <div className="text-right mr-3 hidden sm:block">
            <p className="text-sm lg:text-base font-bold text-white">Super Administrator</p>
            <p className="text-xs text-purple-200 font-medium">MASTER ACCESS</p>
          </div>
          <div className="relative">
            <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center border-3 border-white/50 shadow-xl">
              <svg className="h-6 w-6 lg:h-7 lg:w-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-purple-800 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          {/* Show super admin text on mobile */}
          <div className="ml-2 sm:hidden">
            <p className="text-sm font-bold text-white">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminHeader;
