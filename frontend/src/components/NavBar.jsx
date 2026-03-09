import React from 'react';

const Navbar = () => {
  return (
    <nav className="w-full flex flex-col">
      {/* Top Black Bar */}
      <div className="bg-[#1e293b] text-white px-6 py-2 flex justify-between items-center gap-4">
        
        {/* 1. Logo Section */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded">
            <img className='size-8 rounded-2xl' src="./logo.png" alt="medi-quick-logo" />
          </div>
          <span className="text-xl font-bold tracking-tight text-amber-400 hidden sm:block">
            Medi-Quick
          </span>
        </div>

        {/* 2. Centered Search Bar */}
        <div className="flex-1 flex justify-center max-w-2xl">
          <div className="w-full relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search medicine..."
              className="w-full py-1.5 pl-10 pr-4 rounded-md bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* 3. Action Buttons */}
        <div className="flex items-center gap-4 shrink-0">
          <button className="bg-[#4ade80] hover:bg-[#22c55e] text-[#064e3b] px-3 py-1.5 rounded-md font-semibold text-xs transition-colors whitespace-nowrap">
            Add Medicine
          </button>
          <button className="text-gray-300 hover:text-white text-xs font-medium whitespace-nowrap">
            Admin Login
          </button>
        </div>
      </div>

      {/* Blue Gradient Section (Now just a header/banner) */}
      <div className="bg-linear-to-b from-[#3b82f6] to-[#60a5fa] w-full h-8 flex items-center justify-center px-4">
        <div className="flex w-1/2 justify-center gap-2"><h2 className="text-white font-medium">Your Nearest Pharmacies</h2></div>
        <div className="flex w-1/2 justify-center gap-2"><h2 className="text-white font-medium">Dashboard</h2></div>
      </div>
    </nav>
  );
};

export default Navbar;