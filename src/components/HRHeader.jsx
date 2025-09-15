import React from 'react'
import { useSelector } from 'react-redux'
import userlogo from '../assets/images/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg'

const HRHeader = () => {

    const company = useSelector(state => state.permissions.company)

  return (
    <div>

        <div className="w-[100vw] flex justify-between items-center px-6 lg:px-8 py-4 min-h-[8vh] text-white bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 shadow-xl border-b border-gray-500/30 lg:w-[80vw]">
          {/* Left side - Admin Panel text */}
          <div className="flex items-center">
            <div className="hidden lg:flex items-center">
              <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold text-orange-200">
                HR Portal
              </span>
            </div>
            {/* Mobile only - Admin badge */}
            <div className="lg:hidden flex items-center">
              <div className="h-6 w-6 bg-orange-500 rounded-md flex items-center justify-center mr-2">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-orange-200">HR</span>
            </div>
          </div>

          

          {/* Right side - Admin Actions */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}

            {/* Admin Profile */}
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
              <div className="text-right mr-3 hidden sm:block">
                <p className="text-sm font-semibold text-white">
                  HR
                </p>
                <p className="text-xs text-orange-200">System HR</p>
              </div>
            </div>

            {/* Settings Menu */}
          </div>
        </div>
    </div>
  )
}

export default HRHeader