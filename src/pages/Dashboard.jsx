import React from 'react'
import Sidebar from '../components/Sidebar'
import { IoHome, IoNotifications} from 'react-icons/io5';
import { FaBuildingCircleCheck } from 'react-icons/fa6';
import { MdOutlinePeopleAlt, MdLockReset } from 'react-icons/md';
import { FiShield } from 'react-icons/fi';
import { TbLogs, TbReportAnalytics } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { IoIosLogOut } from 'react-icons/io';
import { useDispatch } from 'react-redux';
import SuperAdminHeader from '../components/SuperAdminHeader';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
    const logoutHandler = () => {
        dispatch(setPermissions(null));
        dispatch(setAllCompany(null));
        dispatch(setCompany(null));
        dispatch(setReduxShifts(null));
        dispatch(setReduxManagers(null));
        dispatch(setReduxDepartments(null));
        navigate("/login");
        toast.success("You have logged out successfully!")
      };
   const menuItems = [
    { icon: <IoHome size={24} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FaBuildingCircleCheck size={24} />, label: 'Register Company', path: '/registercompany' },
    { icon: <MdOutlinePeopleAlt size={24} />, label: 'Company List', path: '/companylist' },
    { icon: <FiShield size={24} />, label: 'Admin Management', path: '/admin-management' },
    // { icon: <MdOutlinePeopleAlt size={24} />, label: 'Employee Management', path: '/employee-management' },
    { icon: <IoNotifications size={24} />, label: 'Notifications', path: '/notifications' },
    // { icon: <TbLogs size={24} />, label: 'Audit Logs', path: '/logs' },
    { icon: <TbReportAnalytics size={24} />, label: 'Reports', path: '/reports' },


  ];

 
  const handleClick = (item) => {
    if (item.action === 'logout') {
      logoutHandler();
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className='relative '>
        <Sidebar  />
        <div className='w-full lg:ml-[20vw] lg:w-[79vw] pr-4 pb-10'>
          <SuperAdminHeader/>
          <div className='w-[90vw] flex justify-center  z-0 top-0 left-9 items-center h-[8vh] text-3xl text-blue-950 font-semibold lg:w-[80vw]' >Dashboard</div>
       <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleClick(item)}
            className='text-xl font-semibold  rounded border  text-blue-900 mb-2 cursor-pointer flex justify-start pl-12 p-3 shadow items-center gap-3'
          >
            <div className='text-4xl '>{item.icon}</div>
            <div className='text-xl font-semibold text-center'>{item.label}</div>
          </div>
        ))}
      </div>
        </div>
    </div>
  )
}

export default Dashboard
