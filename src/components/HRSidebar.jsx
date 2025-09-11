import React, { useState } from "react";
import logo from "../assets/images/WhatsApp Image 2025-06-30 at 16.52.32_498f8c48.jpg";
import { useDispatch, useSelector } from "react-redux";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoIosClose, IoIosLogOut } from "react-icons/io";
import { MdLockReset, MdOutlineAdminPanelSettings, MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { setPermissions, setSubAdminPermissions } from "../slices/companyPermission";
import { setAllCompany } from "../slices/allCompanySlice";
import { setCompany, setReduxShifts } from "../slices/shiftSlice";
import { setReduxManagers } from "../slices/manager";
import { setReduxDepartments } from "../slices/departments";
import toast from "react-hot-toast";

const HRSidebar = () => {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState({});

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const structuredPermissions = {
    "Leave Management": {
      Attendance: [
        { name: "Attendence Approval", link: "/attendenceapproval"},
      ],
      Leave: [
        { name: "Leave Approval", link: "/leaveapproval" }
      ],
    },
    "Exit Formalities": [
      { name: "Resignation Approval", link: "/resignationapproval" },
    ],
    Reports: [
      { name: "Reimbursement Report", link: "/reimbursementreport" },
    ],
  };

  const toggleHeading = (heading) => {
    setExpanded((prev) => ({ ...prev, [heading]: !prev[heading] }));
  };

  const toggleSubHeading = (parentHeading, subHeading) => {
    const key = `${parentHeading}-${subHeading}`;
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const logoutHandler = () => {
    dispatch(setPermissions(null));
    dispatch(setSubAdminPermissions(null));
    dispatch(setAllCompany(null));
    dispatch(setCompany(null));
    dispatch(setReduxShifts(null));
    dispatch(setReduxManagers(null));
    dispatch(setReduxDepartments(null));
    localStorage.clear();
    navigate("/login");
    toast.success("You have logged out successfully!");
  };

  const renderMenuItems = () => {
    return Object.entries(structuredPermissions).map(([heading, items], index) => (
      <div key={index} className="w-full">
        <button
          onClick={() => toggleHeading(heading)}
          className="w-full flex justify-between items-center text-left pl-5 pr-3 py-2 font-semibold text-xl hover:text-blue-300 transition-colors duration-200"
        >
          <span>{heading}</span>
          {expanded[heading] ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
        </button>

        {expanded[heading] && (
          <div className="ml-4 border-l border-blue-500 pl-3 space-y-1">
            {Array.isArray(items) ? (
              // Direct array of items (like Exit Formalities, Reports)
              items.map((item, i) => (
                <div
                  key={i}
                  className="text-lg hover:text-blue-200 cursor-pointer py-1 transition-colors duration-200"
                  onClick={() => navigate(item.link)}
                >
                  {item.name}
                </div>
              ))
            ) : (
              // Nested structure (like Leave Management)
              Object.entries(items).map(([subHeading, subItems], subIndex) => (
                <div key={subIndex} className="w-full">
                  <button
                    onClick={() => toggleSubHeading(heading, subHeading)}
                    className="w-full flex justify-between items-center text-left pr-3 py-1 font-medium text-base hover:text-blue-300 transition-colors duration-200"
                  >
                    <span className="text-xl">{subHeading}</span>
                    {expanded[`${heading}-${subHeading}`] ? (
                      <MdKeyboardArrowDown />
                    ) : (
                      <MdKeyboardArrowRight />
                    )}
                  </button>
                  {expanded[`${heading}-${subHeading}`] && (
                    <div className="ml-4 space-y-1">
                      {subItems.map((item, i) => (
                        <div
                          key={i}
                          className="text-lg hover:text-blue-200 cursor-pointer py-1 transition-colors duration-200"
                          onClick={() => navigate(item.link)}
                        >
                          {item.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="fixed top-0 left-0 z-50">
      {/* Mobile Menu Toggle */}
      <div
        onClick={() => setShow(true)}
        className={`${
          !show ? "flex" : "hidden"
        } text-blue-950 lg:pt-3 lg:pl-3 text-2xl lg:hidden cursor-pointer`}
      >
        <GiHamburgerMenu />
      </div>

      {/* Sidebar */}
      <div
        className={`${
          show ? "flex flex-col" : "hidden"
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

        {/* Manager Header */}
        <div onClick={() => navigate('/managerpanel')} className="w-[90%] cursor-pointer h-[8vh] bg-blue-800 flex gap-3 pl-5 items-center text-white text-2xl font-semibold rounded-xl">
          <MdOutlineAdminPanelSettings /> HR
        </div>

        {/* Navigation Menu */}
        <div className="w-full flex flex-col items-start px-4 text-white text-sm gap-1 flex-1">
          {renderMenuItems()}
        </div>

        {/* Action Buttons */}
        <div className="w-full px-4 space-y-3">
          <div
            onClick={() => navigate("/changepassword")}
            className="flex pl-5 items-center cursor-pointer gap-4 text-white text-xl h-[6vh] w-full bg-blue-800 rounded-full hover:scale-105 hover:bg-blue-700 transition-all duration-200"
          >
            <MdLockReset />
            <span>Reset Password</span>
          </div>

          <div
            onClick={logoutHandler}
            className="flex pl-5 items-center cursor-pointer gap-4 text-white text-xl h-[6vh] w-full bg-red-600 rounded-full hover:scale-105 hover:bg-red-500 transition-all duration-200"
          >
            <IoIosLogOut />
            <span>LogOut</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRSidebar;
