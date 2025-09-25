import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";

const HRPanel = () => {
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedSubSections, setExpandedSubSections] = useState({});
  const navigate = useNavigate();

  const structuredPermissions = {
    "Leave Management": {
      Attendance: [
        {name: "Attendance Creation", link: "/attendancecreation"},
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
        const allItems = getAllItemsFromSection(sectionData);
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
                {allItems.map((entry, idx) => {
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
      <HRSidebar />
      <div className="w-[100vw] lg:w-[79vw] lg:ml-[20vw]">
        {/* Header */}
        <HRHeader/>

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

          {/* Dynamic Permission Cards - No Filtering Applied */}
          {renderPermissionCards()}
        </div>
      </div>
    </div>
  );
};

export default HRPanel;
