import React from 'react'
import { useSelector } from 'react-redux';

const EmployeeHeader = () => {

      const employee = useSelector((state) => state.employees.reduxEmployee);
      const company = useSelector(state => state.permissions.company)

  return (
    <div>

        {/* Employee panel bar */}
               <div className="w-[100vw] flex justify-between items-center px-6 lg:px-8 py-4 min-h-[8vh] text-white bg-gradient-to-r from-gray-700 to-gray-600 shadow-lg lg:w-[80vw]">
                  {/* Left side - Employee Panel text (hidden on mobile) */}
                  <div className="hidden lg:flex items-center">
                    <span className="text-lg font-medium text-gray-200">Employee Portal</span>
                  </div>
        
                  {/* Center - Company Logo and Name */}
                  {/* <div className="flex items-center justify-center flex-1 lg:flex-none">
                    <img 
                      src={company.thumbnail} 
                      alt="company logo" 
                      className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg mr-3 border-2 border-white/20" 
                    />
                    <div className="text-center">
                      <h1 className="text-xl lg:text-2xl font-bold">{company?.name}</h1>
                      <p className="text-xs lg:text-sm text-gray-200 lg:hidden">Employee Portal</p>
                    </div>
                  </div> */}
        
                  {/* Right side - Employee Info */}
                  <div className="flex items-center ml-4">
                    <div className="text-right mr-3 hidden sm:block">
                      <p className="text-sm lg:text-base font-medium">{employee.user?.profile.firstName} {employee.user?.profile.lastName}</p>
                      <p className="text-xs text-gray-300">Employee</p>
                    </div>
                    <div className="relative">
                      <img 
                        src={employee.user?.profile.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                        alt="employee avatar" 
                        className="h-8 w-8 lg:h-10 lg:w-10 rounded-full border-2 border-white/30 object-cover"
                        onError={(e) => {
                          e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                    {/* Show name on mobile below avatar */}
                    <div className="ml-2 sm:hidden">
                      <p className="text-sm font-medium">{employee.user?.profile.firstName}</p>
                    </div>
                  </div>
                </div>

    </div>
  )
}

export default EmployeeHeader