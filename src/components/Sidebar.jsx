import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  IoHome,
  IoNotifications,
  IoLogOutSharp, // Correct replacement for IoIosLogOut
} from 'react-icons/io5';
import { IoIosClose } from 'react-icons/io'; // Correct source for IoIosClose
import { FaBuildingCircleCheck } from 'react-icons/fa6';
import { MdOutlinePeopleAlt, MdLockReset } from 'react-icons/md';
import { FiShield } from 'react-icons/fi';
import { TbLogs, TbReportAnalytics } from 'react-icons/tb';
import { GiHamburgerMenu } from 'react-icons/gi';
import logo from '../assets/images/WhatsApp Image 2025-06-30 at 16.52.32_498f8c48.jpg';
import { setPermissions, setSubAdminPermissions } from '../slices/companyPermission';
import { setCompany, setReduxShifts } from '../slices/shiftSlice';
import { setReduxManagers } from '../slices/manager';
import { setReduxDepartments } from '../slices/departments';
import { setAllCompany } from '../slices/allCompanySlice';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const logoutHandler = () => {
    dispatch(setPermissions(null));
     dispatch(setSubAdminPermissions(null));
    dispatch(setAllCompany(null));
    dispatch(setCompany(null));
    dispatch(setReduxShifts(null));
    dispatch(setReduxManagers(null));
    dispatch(setReduxDepartments(null));
    localStorage.clear();
    navigate('/login');
    toast.success('You have logged out successfully!');
  };

  const navItems = [
    { icon: <IoHome />, label: 'Dashboard', link: '/dashboard' },
    { icon: <FaBuildingCircleCheck />, label: 'Register Company', link: '/registercompany' },
    { icon: <MdOutlinePeopleAlt />, label: 'Company List', link: '/companylist' },
    { icon: <FiShield />, label: 'Admin Management', link: '/adminmanagement' },
    { icon: <MdOutlinePeopleAlt />, label: 'Employee Management', link: '/employeemanagement' },
    { icon: <IoNotifications />, label: 'Notifications', link: '/notifications' },
    { icon: <TbLogs />, label: 'Audit Logs', link: '/auditlogs' },
    { icon: <TbReportAnalytics />, label: 'Reports', link: '/reports' },
  ];

  return (
    <div className="fixed top-0 left-0 z-50">
      {/* Mobile Toggle */}
      <div
        onClick={() => setShow(true)}
        className={`${
          !show ? 'flex' : 'hidden'
        } text-blue-950 pt-3 pl-3 text-2xl lg:hidden cursor-pointer`}
      >
        <GiHamburgerMenu />
      </div>

      {/* Sidebar */}
      <div
        className={`${
          show ? 'flex flex-col' : 'hidden'
        } relative gap-2 h-screen items-center bg-blue-950 w-[80vw] py-4 lg:flex lg:flex-col overflow-y-auto no-scrollbar lg:w-[20vw] lg:gap-3`}
      >
        {/* Close Button (Mobile) */}
        <div
          onClick={() => setShow(false)}
          className="absolute text-4xl right-3 top-2 text-blue-700 lg:hidden cursor-pointer hover:text-blue-500 transition-colors duration-200"
        >
          <IoIosClose />
        </div>

        {/* Logo */}
        <div className="w-full px-4">
          <img src={logo} alt="MASU Consultancy" className="w-full h-auto" />
        </div>

        {/* Header */}
        <div className="w-[90%] h-[8vh] bg-blue-800 flex gap-3 p-5 items-center text-white text-2xl font-semibold rounded-xl">
          Super Admin
        </div>

        {/* Navigation */}
        <div className="w-full flex flex-col items-start px-4 text-white text-sm gap-2 flex-1">
          {navItems.map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(item.link)}
              className="flex pl-5 items-center cursor-pointer gap-4 text-white text-xl h-[6vh] w-full bg-blue-950 rounded-full hover:scale-105 transition-all duration-200"
            >
              {item.icon} <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="w-full px-4 space-y-3 mt-auto pb-4">
          <div
            onClick={() => navigate('/changepassword')}
            className="flex pl-5 items-center cursor-pointer gap-4 text-white text-xl h-[6vh] w-full bg-blue-800 rounded-full hover:scale-105 hover:bg-blue-700 transition-all duration-200"
          >
            <MdLockReset /> <span>Reset Password</span>
          </div>
          <div
            onClick={logoutHandler}
            className="flex pl-5 items-center cursor-pointer gap-4 text-white text-xl h-[6vh] w-full bg-red-600 rounded-full hover:scale-105 hover:bg-red-500 transition-all duration-200"
          >
            <IoLogOutSharp /> <span>LogOut</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
