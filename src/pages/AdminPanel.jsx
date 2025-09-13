import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import AdminHeader from "../components/AdminHeader";

const AdminPanel = () => {
  const permissions = useSelector(
    (state) => state.permissions.permissions || []
  );
  const company = useSelector((state) => state.permissions.company);
  const [revisedPermissions, setRevisedPermissions] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedSubSections, setExpandedSubSections] = useState({});
  const navigate = useNavigate();

  const structuredPermissions = {
    "Add Sub-Admin": [
      { name: "Add Sub-Admin", link: "/addsubadmin" },
    ],
    "Add/Edit Employee": [
      { name: "Add Employee", link: "/addemployee" },
      { name: "Edit Employee", link: "/editemployee" },
    ],
    "Add Manager": [{ name: "Add Manager", link: "/addmanager" }],
    "Payroll Manage": [
      { name: "Payroll Manage", link: "/payrollmanage" },
      {
        name: "Employee master information",
        link: "/employeemasterinformation",
      },
      { name: "CTC Structure", link: "/ctcstructure" },
      { name: "Payments & Deductions", link: "/paymentsanddeductions" },
      { name: "Perquisites Investments", link: "/perquisitesinvestments" },
      { name: "Tax Computation", link: "/taxcomputation" },
      { name: "Reimbursement", link: "/reimbursementcategory" },
      { name: "Flexi", link: "/flexi" },
      { name: "Tax computation sheet", link: "/taxcomputationsheet" },
      {
        name: "Investments (All sections: BOC,BOD,24b,etc.)",
        link: "/investments",
      },
      { name: "Payroll Calculation", link: "/payrollcalculation" },
    ],
    "Leave Management": {
      Attendance: [
        { name: "Shift Management", link: "/shiftmanagement" },
        { name: "Shift Assign", link: "/shiftassign" },
        { name: "Attendence Assign", link: "/attendenceassign" },
        { name: "Attendence Approval", link: "/attendenceapproval"},
      ],
      Leave: [
        { name: "Add Leave", link: "/addleavepolicy" },
        { name: "Leave Assign", link: "/leaveassign" },
        { name: "Leave Approval", link: "/leaveapproval" },
        { name: "Leave Balance", link: "/adminleavebalance" },
      ],
      "Overtime Tracking": [
        { name: "Rule", link: "/overtimerule" },
        { name: "History", link: "/overtimehistory" },
      ],
    },
    Policies: [{ name: "Policies", link: "/policies" }],
    "Holidays": [
      { name: "Company Holidays", link: "/companyholidays" },
    ],
    "ON Boarding": [{ name: "New Joiners Form", link: "/newjoinersform" }],
    "Exit Formalities": [
      { name: "Resignation Setup", link: "/resignationsetup" },
      { name: "Resignation Approval", link: "/resignationapproval" },
    ],
    Performance: [{ name: "Self Evaluation (KRA)", link: "/selfevaluation" }],
    Reports: [
      { name: "Employee Master Report", link: "/employeemasterreport" },
      { name: "CTC Structure Report", link: "/ctcstructurereport" },
      {
        name: "Payments & Deductions Report",
        link: "/paymentsanddeductionsreport",
      },
      { name: "Declaration", link: "/declaration" },
      { name: "Actuals", link: "/actuals" },
      { name: "Tax Computation Report", link: "/taxcomputationreport" },
      { name: "Reimbursement Report", link: "/reimbursementreport" },
      { name: "Flexi Report", link: "/flexireport" },
      {
        name: "LIC/Credit Society Deductions",
        link: "/liccreditsocietydeductions",
      },
      { name: "Investments Report", link: "/investmentsreport" },
      { name: "Payroll Calculation Report", link: "/payrollcalculationreport" },
      { name: "Attendence Report", link: "/attendencereport" },
      { name: "Leave Report", link: "/leavereport" },
      { name: "Overtime Report", link: "/overtimereport" },
      { name: "Individual Report", link: "/individualreport" },
    ],
  };

  useEffect(() => {
    const cloned = [...permissions];
    if (permissions.includes("Reimbursement Report")) {
      setRevisedPermissions([...cloned, "Reimbursement Category"]);
    } else {
      setRevisedPermissions([...cloned]);
    }
  }, []);

  const getAllItemsFromSection = (sectionData) => {
    if (Array.isArray(sectionData)) return sectionData;
    const allItems = [];
    Object.entries(sectionData).forEach(([key, subSection]) => {
      if (Array.isArray(subSection)) {
        allItems.push({ subHeading: key, items: subSection });
      }
    });
    return allItems;
  };

  const getFilteredPermissions = (sectionData) => {
    const allItems = getAllItemsFromSection(sectionData);
    return allItems
      .map((entry) => {
        if (entry.items) {
          const filtered = entry.items.filter(
            (item) =>
              revisedPermissions.includes(item.name) ||
              item.name === "Shift Management"
          );
          return filtered.length
            ? { subHeading: entry.subHeading, items: filtered }
            : null;
        }
        return revisedPermissions.includes(entry.name) ||
          entry.name === "Shift Management"
          ? entry
          : null;
      })
      .filter(Boolean);
  };

  const hasSectionPermissions = (sectionData) => {
    const allItems = getAllItemsFromSection(sectionData);
    return allItems.some((entry) => {
      if (entry.items) {
        return entry.items.some(
          (item) =>
            revisedPermissions.includes(item.name) ||
            item.name === "Shift Management"
        );
      }
      return (
        revisedPermissions.includes(entry.name) ||
        entry.name === "Shift Management"
      );
    });
  };

  const toggleCard = (cardName) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardName]: !prev[cardName],
    }));
  };

  const toggleSubSection = (section, subHeading) => {
    const key = `${section}-${subHeading}`;
    setExpandedSubSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderPermissionCards = () => {
    return Object.entries(structuredPermissions).map(
      ([section, sectionData], i) => {
        if (!hasSectionPermissions(sectionData)) return null;

        const allowedItems = getFilteredPermissions(sectionData);
        const isExpanded = expandedCards[section];

        return (
          <div
            key={i}
            className={`bg-white rounded-lg shadow-md border border-gray-300 p-4 transition-all duration-300 ${
              isExpanded ? "shadow-lg scale-[1.02]" : "hover:shadow-lg"
            }`}
          >
            <button
              onClick={() => toggleCard(section)}
              className="w-full flex justify-between items-center text-left text-lg font-semibold text-blue-900 mb-2"
            >
              <span>{section}</span>
              {isExpanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
            </button>

            {isExpanded && (
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {allowedItems.map((entry, idx) => {
                  if (entry.items) {
                    const subKey = `${section}-${entry.subHeading}`;
                    const isSubExpanded = expandedSubSections[subKey];

                    return (
                      <li key={subKey} className="list-none">
                        <button
                          onClick={() =>
                            toggleSubSection(section, entry.subHeading)
                          }
                          className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-800 mb-1"
                        >
                          <span>{entry.subHeading}</span>
                          {isSubExpanded ? (
                            <MdKeyboardArrowDown />
                          ) : (
                            <MdKeyboardArrowRight />
                          )}
                        </button>

                        {isSubExpanded && (
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            {entry.items.map((item, subIdx) => (
                              <li
                                key={`${subKey}-${subIdx}`}
                                className="cursor-pointer hover:text-blue-950 hover:underline transition-colors duration-200"
                                onClick={() => navigate(item.link)}
                              >
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li
                      key={idx}
                      className="cursor-pointer hover:text-blue-950 hover:underline transition-colors duration-200"
                      onClick={() => navigate(entry.link)}
                    >
                      {entry.name}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      }
    );
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-[100vw] lg:w-[79vw] lg:ml-[20vw]">
        {/* Header */}
        <AdminHeader/>

        {/* Content Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Department Card */}
          <div
            className={`bg-white rounded-lg shadow-md border border-gray-300 p-4 transition-all duration-300 ${
              expandedCards["Department"]
                ? "shadow-lg scale-[1.02]"
                : "hover:shadow-lg"
            }`}
          >
            <button
              onClick={() => toggleCard("Department")}
              className="w-full flex justify-between items-center text-left text-lg font-semibold text-blue-900 mb-2"
            >
              <span>Department</span>
              {expandedCards["Department"] ? (
                <MdKeyboardArrowDown />
              ) : (
                <MdKeyboardArrowRight />
              )}
            </button>

            {expandedCards["Department"] && (
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li
                  className="cursor-pointer hover:text-blue-950 hover:underline transition-colors duration-200"
                  onClick={() => navigate("/adddepartment")}
                >
                  Add Department
                </li>
              </ul>
            )}
          </div>

          {/* Customize Table Card */}
          <div
            className={`bg-white rounded-lg shadow-md border border-gray-300 p-4 transition-all duration-300 ${
              expandedCards["Customize Table"]
                ? "shadow-lg scale-[1.02]"
                : "hover:shadow-lg"
            }`}
          >
            <button
              onClick={() => toggleCard("Customize Table")}
              className="w-full flex justify-between items-center text-left text-lg font-semibold text-blue-900 mb-2"
            >
              <span>Customize Table</span>
              {expandedCards["Customize Table"] ? (
                <MdKeyboardArrowDown />
              ) : (
                <MdKeyboardArrowRight />
              )}
            </button>

            {expandedCards["Customize Table"] && (
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li
                  className="cursor-pointer hover:text-blue-950 hover:underline transition-colors duration-200"
                  onClick={() => navigate("/customizetablesequence")}
                >
                  Customize Table Sequence
                </li>
              </ul>
            )}
          </div>

          {/* Dynamic Permission Cards */}
          {renderPermissionCards()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
