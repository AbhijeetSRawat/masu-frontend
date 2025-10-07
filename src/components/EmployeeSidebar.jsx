import React, { useState } from "react";
import logo from "../assets/images/WhatsApp Image 2025-06-30 at 16.52.32_498f8c48.jpg";
import { useDispatch, useSelector } from "react-redux";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoIosClose, IoIosLogOut } from "react-icons/io";
import {
  MdLockReset,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
} from "react-icons/md";
import { IoManOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { setPermissions, setSubAdminPermissions } from "../slices/companyPermission";
import { setAllCompany } from "../slices/allCompanySlice";
import { setCompany, setReduxShifts } from "../slices/shiftSlice";
import { setReduxManagers } from "../slices/manager";
import { setReduxDepartments } from "../slices/departments";
import userlogo from '../assets/images/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg'
import toast from "react-hot-toast";

const EmployeeSidebar = () => {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector((state) => state.auth.role);

  const company = useSelector(state => state.permissions.company)

  const tabs = {
    Dashboard: [{ name: "Employee Dashboard", link: "/employeepanel" }],
    "My Profile": [{ name: "Personal Information", link: "/employeeprofile" }],
    "CTC & Salary Structure": [
      { name: "Salary Breakdown", link: "/salarybreakdown" },
    ],
    "Pay Slip": [{ name: "Select MM/YY", link: "/payslip" }],
    Investment: [
      { name : "Perquisites", link:"/employeeperquisites"},
      { name: "Declaration", link: "/declaration" },
      { name: "Approval Status", link: "/approvalstatus" },
    ],
    Reimbursement: [
      { name: "Investment", link: "/investment" },
      { name: "Reimbursements", link: "/reimbursements" },
    ],
    "Tax Compliance": [
      { name: "Tax Regime Selection (old/new)", link: "/taxregimeselection" },
      { name: "Tax Computation Sheet", link: "/taxcomputationemployee" },
    ],
    Attendence: [
      { name: "Daily Attendence Records", link: "/attendence" },
      { name: "Attendence Regularization", link: "/attendenceregularization" }
    ],
    "Leave Management": [
      { name: "Apply for Leave", link: "/addleave" },
      { name: "Leave Balance", link: "/leavebalance" },
      { name: "OT Hours & Adjustment", link: "/othoursandadjustment" },
    ],
    Policies: [{ name: "Policy", link: "/employeepolicy" }],
    "On Boarding and Exit": [
      
      {
        name: "Resignation Submission & Notice Period",
        link: "/onboardingandexit",
      },
    ],
    "Upload Documents" : [
       { name: "Upload Documents", link: "/uploaddocuments" },
    ],
    "Performance & Reports": [
      { name: "Self Evaluation & KRA", link: "/selfevaluation" },
      { name: "ESS", link: "/ESS" },
    ],
  };

  const toggleSection = (heading) => {
    setExpanded((prev) => ({ ...prev, [heading]: !prev[heading] }));
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

  // 🔍 Filter tabs based on role
  const filteredTabs = Object.entries(tabs).filter(([heading]) => {
    if (role === "newjoiner") {
      return heading === "My Profile" || heading === "Upload Documents";
    }
    if (role === "employee") {
      return heading !== "Upload Documents";
    }
    return true; // default: show all
  });

  const renderTabs = () =>
    filteredTabs.map(([heading, items], index) => (
      <div key={index} className="w-full">
        <button
          onClick={() => toggleSection(heading)}
          className="w-full flex justify-between items-center text-left pl-5 pr-3 py-2 font-semibold text-xl hover:text-blue-300 transition-colors duration-200"
        >
          <span>{heading}</span>
          {expanded[heading] ? (
            <MdKeyboardArrowDown />
          ) : (
            <MdKeyboardArrowRight />
          )}
        </button>

        {expanded[heading] && (
          <div className="ml-4 border-l border-blue-500 pl-3 space-y-1">
            {items.map((item, i) => (
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
    ));

  return (
    <div className="fixed top-0 left-0 z-50">
      {/* Mobile Toggle */}
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
        {/* Close Button */}
        <div
          onClick={() => setShow(false)}
          className="absolute text-4xl right-3 top-2 text-blue-700 lg:hidden cursor-pointer hover:text-blue-500 transition-colors duration-200"
        >
          <IoIosClose />
        </div>

        {/* Logo */}
          {/* Logo */}
                <div className="w-full flex justify-center px-4">
                  <img src={ company.thumbnail || userlogo } alt="MASU Consultancy" className=" h-[25vh] rounded-4xl" />
                </div>

        {/* Employee Header */}
        <div className="w-[90%] h-[8vh] bg-blue-800 flex gap-3 p-5 items-center text-white text-2xl font-semibold rounded-xl">
          <IoManOutline /> Employee
        </div>

        {/* Navigation */}
        <div className="w-full flex flex-col items-start px-4 text-white text-lg gap-1 flex-1">
          {renderTabs()}
        </div>

        {/* Footer Actions */}
        <div className="w-full px-4 space-y-3 mt-auto pb-4">
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

export default EmployeeSidebar;
