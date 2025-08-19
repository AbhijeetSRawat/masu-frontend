import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { useSelector } from "react-redux";
import {
  FaRegCalendarXmark,
  FaMoneyBillTrendUp,
  FaWpforms,
} from "react-icons/fa6";
import { CgProfile } from "react-icons/cg";
import {
  MdOutlinePayments,
  MdOutlineFactCheck,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
} from "react-icons/md";
import { TbTax } from "react-icons/tb";
import { SlCalender } from "react-icons/sl";
import { FcOvertime } from "react-icons/fc";
import { ImExit } from "react-icons/im";
import { GrDocumentPerformance } from "react-icons/gr";
import EmployeeHeader from "../components/EmployeeHeader";

const EmployeePanel = () => {
  const employee = useSelector((state) => state.employees.reduxEmployee);
  const navigate = useNavigate();
  const [expandedTabs, setExpandedTabs] = useState({});

   const company = useSelector((state) => state.permissions.company);

  const structuredTabs = {
    "My Profile": {
      icon: <CgProfile />,
      items: [{ name: "Personal Information", link: "/employeeprofile" }],
    },
    "CTC & Salary Structure": {
      icon: <MdOutlineFactCheck />,
      items: [{ name: "Salary Breakdown", link: "/salarybreakdown" }],
    },
    "Pay Slip": {
      icon: <MdOutlinePayments />,
      items: [{ name: "Select MM/YY", link: "/payslip" }],
    },
    "Investment": {
      icon: <FaMoneyBillTrendUp />,
      items: [
        { name: "Declaration", link: "/declaration" },
        { name: "Approval Status", link: "/approvalstatus" },
      ],
    },
    "Reimbursement": {
      icon: <FaWpforms />,
      items: [
        { name: "Investment", link: "/investment" },
        { name: "Reimbursements", link: "/reimbursements" },
      ],
    },
    "Tax Compliance": {
      icon: <TbTax />,
      items: [
        { name: "Tax Regime Selection (old/new)", link: "/taxregimeselection" },
        { name: "Tax Computation Sheet", link: "/taxcomputation" },
      ],
    },
    "Attendance": {
      icon: <SlCalender />,
      items: [{ name: "Daily Attendance Records", link: "/attendence" }],
    },
    "Leave Management": {
      icon: <FaRegCalendarXmark />,
      items: [
        { name: "Apply for Leave", link: "/addleave" },
        { name: "Leave Balance", link: "/leavebalance" },
        { name: "OT Hours & Adjustment", link: "/othours" },
      ],
    },
    "Policies":{
      icon: <FcOvertime />,
      items: [
        { name: "Policy", link: "/employeepolicy" },
      ],
    },
    "On Boarding and Exit": {
      icon: <ImExit />,
      items: [
        {
          name: "Resignation Submission & Notice Period",
          link: "/onboardingandexit",
        },
      ],
    },
    "Performance & Reports": {
      icon: <GrDocumentPerformance />,
      items: [
        { name: "Self Evaluation & KRA", link: "/performanceandreport" },
        { name: "ESS", link: "/ESS" },
      ],
    },
  };

  const toggleTab = (tabName) => {
    setExpandedTabs((prev) => ({
      ...prev,
      [tabName]: !prev[tabName],
    }));
  };

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:w-[80vw] lg:ml-[20vw]">
        {/* Header */}
          <EmployeeHeader/>

        {/* Grid Layout */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(structuredTabs).map(([tabName, { icon, items }]) => (
            <div
              key={tabName}
              className="bg-white rounded-lg shadow-md border border-gray-300"
            >
              {/* Tab Header */}
              <button
                onClick={() => toggleTab(tabName)}
                className="w-full flex justify-between items-center px-6 py-4 text-left text-xl font-semibold text-blue-900 hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="flex items-center gap-3">
                  {icon} {tabName}
                </span>
                {expandedTabs[tabName] ? (
                  <MdKeyboardArrowDown className="text-2xl" />
                ) : (
                  <MdKeyboardArrowRight className="text-2xl" />
                )}
              </button>

              {/* Dropdown Content */}
              {expandedTabs[tabName] && (
                <div className="border-t border-gray-200">
                  <ul className="px-10 py-4 space-y-2 text-gray-700 text-base">
                    {items.map((item, idx) => (
                      <li
                        key={idx}
                        className="cursor-pointer hover:text-blue-950 hover:underline transition-colors duration-200"
                        onClick={() => navigate(item.link)}
                      >
                        • {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeePanel;
