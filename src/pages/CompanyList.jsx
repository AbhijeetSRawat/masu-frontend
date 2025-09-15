import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { companyEndpoints } from "../services/api";
import { useDispatch, useSelector } from "react-redux";
import { setAllCompany, setLoading } from "../slices/allCompanySlice";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import { setCompany, setPermissions } from "../slices/companyPermission";
import { Navigate, useNavigate } from "react-router-dom";
import { setReduxShifts } from "../slices/shiftSlice";
import { setReduxManagers } from "../slices/manager";
import { setReduxDepartments } from "../slices/departments";
import { setReduxEmployee } from "../slices/employee";
import SuperAdminHeader from "../components/SuperAdminHeader";
import html2pdf from 'html2pdf.js';

const { COMPANY_LIST_API, PERMISSIONS_API, UPDATE_DETAILS_API, DOWNLOAD_COMPANY_DETAILS } =
  companyEndpoints;

const CompanyList = () => {
  const [companyList, setCompanyList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.allCompany.loading);

  const getCompanyList = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("GET", COMPANY_LIST_API);
      setCompanyList(response.data?.data || []);
      dispatch(setAllCompany(response.data?.data || []));
    } catch (error) {
      console.error("Error fetching company list:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const downloadCompanyDetails = async (company) => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("GET", `${DOWNLOAD_COMPANY_DETAILS}${company._id}`);
      console.log(response.data);
      const companyData = response.data || company;
      generateHTMLPDF(companyData);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error downloading company details:", error);
      toast.error("Failed to download company details");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const generateHTMLPDF = (companyData) => {
    const safeGet = (obj, path, defaultValue = 'N/A') => {
      try {
        return path.split('.').reduce((current, key) => {
          return current && current[key] !== undefined ? current[key] : defaultValue;
        }, obj);
      } catch (error) {
        return defaultValue;
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      try {
        return new Date(dateStr).toLocaleDateString();
      } catch {
        return 'N/A';
      }
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.4;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; page-break-after: avoid;">
          <h1 style="color: #2c3e50; margin-bottom: 10px; font-size: 24px;">COMPREHENSIVE COMPANY REPORT :- <br/> ${safeGet(companyData, 'company.name')}</h1>
          <p style="color: #7f8c8d; margin: 5px 0;">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p style="color: #7f8c8d; margin: 5px 0;">Export Date: ${formatDate(companyData.exportedAt)}</p>
          <hr style="border: 1px solid #3498db; margin: 20px 0;">
        </div>

        <!-- Company Overview Statistics -->
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 5px; font-size: 18px;">Company Overview & Statistics</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #3498db; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Metric</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Count</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Total Users</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.users || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Total Employees</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.employees || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Total Departments</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.departments || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Total Shifts</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.shifts || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Leave Policies</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.leavePolicies || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Total Leaves</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.leaves || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Policies</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.policies || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Reimbursement Categories</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.reimbursementCategories || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Reimbursements</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.reimbursements || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Attendance Regularizations</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.attendanceRegularizations || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Resignations</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${companyData.counts?.resignations || 'N/A'}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Company Information -->
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #2980b9; border-bottom: 2px solid #2980b9; padding-bottom: 5px; font-size: 18px;">Company Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #2980b9; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Field</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Company Name</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${safeGet(companyData, 'company.name')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Email</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.email')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Registration Number</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.registrationNumber')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Website</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.website')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Contact Email</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.contactEmail')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Contact Phone</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.contactPhone')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Company ID</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.companyId')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Active Status</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: ${companyData.company?.isActive ? 'green' : 'red'};">${companyData.company?.isActive ? 'Active' : 'Inactive'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Created At</td><td style="border: 1px solid #ddd; padding: 6px;">${formatDate(companyData.company?.createdAt)}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Updated At</td><td style="border: 1px solid #ddd; padding: 6px;">${formatDate(companyData.company?.updatedAt)}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Address Information -->
        ${companyData.company?.address ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #9b59b6; border-bottom: 2px solid #9b59b6; padding-bottom: 5px; font-size: 18px;">Address Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #9b59b6; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Field</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Street</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.address.street')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">City</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.address.city')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">State</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.address.state')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Country</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.address.country')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Pincode</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.address.pincode')}</td></tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Tax Details -->
        ${companyData.company?.taxDetails ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #e67e22; border-bottom: 2px solid #e67e22; padding-bottom: 5px; font-size: 18px;">Tax Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #e67e22; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Field</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">GST Number</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.taxDetails.gstNumber')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">PAN Number</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.taxDetails.panNumber')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">TAN Number</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.taxDetails.tanNumber')}</td></tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Bank Details -->
        ${companyData.company?.bankDetails ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 5px; font-size: 18px;">Bank Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #27ae60; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Field</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Account Number</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.bankDetails.accountNumber')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">IFSC Code</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.bankDetails.ifscCode')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">Account Holder Name</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.bankDetails.accountHolderName')}</td></tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- HR Details -->
        ${companyData.company?.hrDetails ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #c0392b; border-bottom: 2px solid #c0392b; padding-bottom: 5px; font-size: 18px;">HR Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #c0392b; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Field</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">HR Name</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.hrDetails.name')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">HR Email</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.hrDetails.email')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">HR Phone</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.hrDetails.phone')}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 6px;">HR Designation</td><td style="border: 1px solid #ddd; padding: 6px;">${safeGet(companyData, 'company.hrDetails.designation')}</td></tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Custom Fields -->
        ${companyData.company?.customFields?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #8e44ad; border-bottom: 2px solid #8e44ad; padding-bottom: 5px; font-size: 18px;">Custom Fields</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #8e44ad; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Label</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Type</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Required</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.company.customFields.map(field => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${field.label || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${field.name || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${field.type || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${field.required ? 'Yes' : 'No'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Page Break -->
        <div style="page-break-before: always;"></div>

        <!-- Company Permissions -->
        ${companyData.company?.permissions?.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="color: #34495e; border-bottom: 2px solid #34495e; padding-bottom: 5px; font-size: 18px;">Company Permissions (${companyData.company.permissions.length} permissions)</h2>
          <div style="column-count: 3; column-gap: 20px; margin-top: 15px; font-size: 11px;">
            ${companyData.company.permissions.map((perm, index) => `
              <div style="break-inside: avoid; margin-bottom: 5px; padding: 3px 5px; background-color: #f8f9fa; border-left: 3px solid #34495e;">
                <strong>${index + 1}.</strong> ${perm.replace(/&amp;/g, '&')}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Departments -->
        ${companyData.data?.departments?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-before: always;">
          <h2 style="color: #16a085; border-bottom: 2px solid #16a085; padding-bottom: 5px; font-size: 18px;">Departments (${companyData.data.departments.length} departments)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
            <thead>
              <tr style="background-color: #16a085; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Description</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Manager</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.departments.map(dept => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${dept.name || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${(dept.description || 'N/A').substring(0, 50)}${dept.description?.length > 50 ? '...' : ''}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${dept.manager?.user?.profile?.firstName || ''} ${dept.manager?.user?.profile?.lastName || ''}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${formatDate(dept.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Users Summary -->
        ${companyData.data?.users?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-before: always;">
          <h2 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 5px; font-size: 18px;">Users Summary (${companyData.data.users.length} users)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px;">
            <thead>
              <tr style="background-color: #e74c3c; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Email</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Role</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Department</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.users.slice(0, 50).map(user => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 5px;">${(user.profile?.firstName || '') + ' ' + (user.profile?.lastName || '') || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 5px; font-size: 9px;">${user.email || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 5px; text-transform: capitalize;">${user.role || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 5px;">${user.profile?.department || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 5px; color: ${user.isActive ? 'green' : 'red'}; font-weight: bold;">${user.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              `).join('')}
              ${companyData.data.users.length > 50 ? `<tr><td colspan="5" style="text-align: center; padding: 10px; font-style: italic; color: #7f8c8d;">... and ${companyData.data.users.length - 50} more users</td></tr>` : ''}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Employees Detailed Information -->
        ${companyData.data?.employees?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-before: always;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 5px; font-size: 18px;">Employees Detailed Information (${companyData.data.employees.length} employees)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9px;">
            <thead>
              <tr style="background-color: #2c3e50; color: white;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Name</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Email</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Emp ID</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Department</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Designation</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Type</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Joining Date</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.employees.slice(0, 40).map(employee => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 4px;">${(employee.user?.profile?.firstName || '') + ' ' + (employee.user?.profile?.lastName || '') || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 8px;">${employee.user?.email || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-weight: bold;">${employee.employmentDetails?.employeeId || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${employee.employmentDetails?.department?.name || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${employee.employmentDetails?.designation || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; text-transform: capitalize;">${employee.employmentDetails?.employmentType || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${formatDate(employee.employmentDetails?.joiningDate)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; color: ${employee.isActive ? 'green' : 'red'}; font-weight: bold;">${employee.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              `).join('')}
              ${companyData.data.employees.length > 40 ? `<tr><td colspan="8" style="text-align: center; padding: 10px; font-style: italic; color: #7f8c8d;">... and ${companyData.data.employees.length - 40} more employees</td></tr>` : ''}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Shifts Information -->
        ${companyData.data?.shifts?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-before: always;">
          <h2 style="color: #1abc9c; border-bottom: 2px solid #1abc9c; padding-bottom: 5px; font-size: 18px;">Shifts Information (${companyData.data.shifts.length} shifts)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
            <thead>
              <tr style="background-color: #1abc9c; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Start Time</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">End Time</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Grace Period</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Break Duration</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Night Shift</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.shifts.map(shift => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${shift.name || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${shift.startTime || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${shift.endTime || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${shift.gracePeriod ? shift.gracePeriod + ' min' : 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${shift.breakDuration ? shift.breakDuration + ' min' : 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; color: ${shift.isNightShift ? '#e74c3c' : '#27ae60'}; font-weight: bold;">${shift.isNightShift ? 'Yes' : 'No'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; color: ${shift.isActive ? 'green' : 'red'}; font-weight: bold;">${shift.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Leave Policies -->
        ${companyData.data?.leavePolicies?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-before: always;">
          <h2 style="color: #f39c12; border-bottom: 2px solid #f39c12; padding-bottom: 5px; font-size: 18px;">Leave Policies</h2>
          ${companyData.data.leavePolicies.map(policy => `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #d68910; font-size: 14px;">Policy Overview</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; margin-bottom: 20px;">
                <tbody>
                  <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #fdf6e3;">Year Start Month</td><td style="border: 1px solid #ddd; padding: 6px;">${policy.yearStartMonth || 'N/A'}</td></tr>
                  <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #fdf6e3;">Include Week Off</td><td style="border: 1px solid #ddd; padding: 6px;">${policy.includeWeekOff ? 'Yes' : 'No'}</td></tr>
                  <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #fdf6e3;">Sandwich Leave</td><td style="border: 1px solid #ddd; padding: 6px;">${policy.sandwichLeave ? 'Yes' : 'No'}</td></tr>
                  <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #fdf6e3;">Week Off Days</td><td style="border: 1px solid #ddd; padding: 6px;">${policy.weekOff ? policy.weekOff.map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]).join(', ') : 'N/A'}</td></tr>
                  <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #fdf6e3;">Total Leave Types</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${policy.leaveTypes?.length || 0}</td></tr>
                  <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #fdf6e3;">Total Holidays</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${policy.holidays?.length || 0}</td></tr>
                </tbody>
              </table>

              ${policy.leaveTypes?.length > 0 ? `
              <h3 style="color: #d68910; font-size: 14px;">Leave Types</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px;">
                <thead>
                  <tr style="background-color: #f39c12; color: white;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Name</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Code</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Max/Request</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Min/Request</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Approval Required</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Documents Required</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Unpaid</th>
                  </tr>
                </thead>
                <tbody>
                  ${policy.leaveTypes.map(type => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${type.name || 'N/A'}</td>
                      <td style="border: 1px solid #ddd; padding: 6px; background-color: #f8f9fa; font-weight: bold;">${type.shortCode || 'N/A'}</td>
                      <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${type.maxPerRequest || 'N/A'}</td>
                      <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${type.minPerRequest || 'N/A'}</td>
                      <td style="border: 1px solid #ddd; padding: 6px; text-align: center; color: ${type.requiresApproval ? '#e74c3c' : '#27ae60'};">${type.requiresApproval ? 'Yes' : 'No'}</td>
                      <td style="border: 1px solid #ddd; padding: 6px; text-align: center; color: ${type.requiresDocs ? '#e74c3c' : '#27ae60'};">${type.requiresDocs ? 'Yes' : 'No'}</td>
                      <td style="border: 1px solid #ddd; padding: 6px; text-align: center; color: ${type.unpaid ? '#e74c3c' : '#27ae60'};">${type.unpaid ? 'Yes' : 'No'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ` : ''}

              ${policy.holidays?.length > 0 ? `
              <h3 style="color: #d68910; font-size: 14px; margin-top: 20px;">Company Holidays</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px;">
                <thead>
                  <tr style="background-color: #f39c12; color: white;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Name</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Date</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Recurring</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${policy.holidays.map(holiday => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${holiday.name || 'N/A'}</td>
                      <td style="border: 1px solid #ddd; padding: 6px;">${formatDate(holiday.date)}</td>
                      <td style="border: 1px solid #ddd; padding: 6px; text-align: center; color: ${holiday.recurring ? '#27ae60' : '#e74c3c'};">${holiday.recurring ? 'Yes' : 'No'}</td>
                      <td style="border: 1px solid #ddd; padding: 6px;">${(holiday.description || 'N/A').substring(0, 100)}${holiday.description?.length > 100 ? '...' : ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Leave Applications -->
        ${companyData.data?.leaves?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-before: always;">
          <h2 style="color: #9b59b6; border-bottom: 2px solid #9b59b6; padding-bottom: 5px; font-size: 18px;">Leave Applications Summary (${companyData.data.leaves.length} applications)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px;">
            <thead>
              <tr style="background-color: #9b59b6; color: white;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Employee</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Type</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Start Date</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">End Date</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Days</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Status</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Reason</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.leaves.slice(0, 30).map(leave => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 4px;">${leave.employee ? ((leave.employee.user?.profile?.firstName || '') + ' ' + (leave.employee.user?.profile?.lastName || '')) : 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-weight: bold;">${leave.leaveType || leave.shortCode || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${formatDate(leave.startDate)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${formatDate(leave.endDate)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-weight: bold;">${leave.days || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; text-transform: capitalize; font-weight: bold; color: ${leave.status === 'approved' ? 'green' : leave.status === 'rejected' ? 'red' : '#f39c12'};">${leave.status || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 9px;">${(leave.reason || 'N/A').substring(0, 50)}${leave.reason?.length > 50 ? '...' : ''}</td>
                </tr>
              `).join('')}
              ${companyData.data.leaves.length > 30 ? `<tr><td colspan="7" style="text-align: center; padding: 10px; font-style: italic; color: #7f8c8d;">... and ${companyData.data.leaves.length - 30} more leave applications</td></tr>` : ''}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Attendance Regularizations -->
        ${companyData.data?.attendanceRegularizations?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-before: always;">
          <h2 style="color: #e67e22; border-bottom: 2px solid #e67e22; padding-bottom: 5px; font-size: 18px;">Attendance Regularizations (${companyData.data.attendanceRegularizations.length} regularizations)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px;">
            <thead>
              <tr style="background-color: #e67e22; color: white;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Employee</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Date</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Type</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">In Time</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Out Time</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Status</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Reason</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.attendanceRegularizations.map(reg => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 4px;">${reg.employee ? ((reg.user?.profile?.firstName || '') + ' ' + (reg.user?.profile?.lastName || '')) : 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${formatDate(reg.date)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; text-transform: capitalize; font-weight: bold;">${(reg.regularizationType || 'N/A').replace('_', ' ')}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${reg.requestedInTime || reg.actualInTime || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${reg.requestedOutTime || reg.actualOutTime || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; text-transform: capitalize; font-weight: bold; color: ${reg.status === 'approved' ? 'green' : reg.status === 'rejected' ? 'red' : '#f39c12'};">${reg.status || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 9px;">${(reg.reason || 'N/A').substring(0, 40)}${reg.reason?.length > 40 ? '...' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Reimbursement Categories -->
        ${companyData.data?.reimbursementCategories?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 5px; font-size: 18px;">Reimbursement Categories (${companyData.data.reimbursementCategories.length} categories)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #27ae60; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Description</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Created By</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.reimbursementCategories.map(category => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${category.name || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${(category.description || 'N/A').substring(0, 80)}${category.description?.length > 80 ? '...' : ''}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${category.createdBy?.profile?.firstName || ''} ${category.createdBy?.profile?.lastName || ''}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${formatDate(category.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Reimbursements -->
        ${companyData.data?.reimbursements?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #16a085; border-bottom: 2px solid #16a085; padding-bottom: 5px; font-size: 18px;">Reimbursements (${companyData.data.reimbursements.length} reimbursements)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
            <thead>
              <tr style="background-color: #16a085; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Employee</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Category</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Amount</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Date</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Status</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Description</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.reimbursements.map(reimbursement => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${reimbursement.employee ? ((reimbursement.employee.user?.profile?.firstName || '') + ' ' + (reimbursement.employee.user?.profile?.lastName || '')) : 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${reimbursement.category?.name || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #27ae60;">₹${reimbursement.amount || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${formatDate(reimbursement.date)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-transform: capitalize; font-weight: bold; color: ${reimbursement.status === 'approved' ? 'green' : reimbursement.status === 'rejected' ? 'red' : '#f39c12'};">${reimbursement.status || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${(reimbursement.description || 'N/A').substring(0, 50)}${reimbursement.description?.length > 50 ? '...' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Resignations -->
        ${companyData.data?.resignations?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #16a085; border-bottom: 2px solid #16a085; padding-bottom: 5px; font-size: 18px;">Resignations (${companyData.data.resignations.length} resignations)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
            <thead>
              <tr style="background-color: #16a085; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Employee</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Reason</th>

                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Resignation Date</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Status</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Description</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.resignations.map(resignation => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${resignation.employee ? ((resignation.employee.user?.profile?.firstName || '') + ' ' + (resignation.employee.user?.profile?.lastName || '')) : 'N/A'}</td>
                  
                  <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #27ae60;">${resignation.reason || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${formatDate(resignation.updatedAt)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-transform: capitalize; font-weight: bold; color: ${resignation.status === 'approved' ? 'green' : resignation.status === 'rejected' ? 'red' : '#f39c12'};">${resignation.status || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${(resignation.reason || 'N/A').substring(0, 50)}${resignation.reason?.length > 50 ? '...' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Company Policies -->
        ${companyData.data?.policies?.length > 0 ? `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #c0392b; border-bottom: 2px solid #c0392b; padding-bottom: 5px; font-size: 18px;">Company Policies (${companyData.data.policies.length} policies)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #c0392b; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Title</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Description</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Document</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${companyData.data.policies.map(policy => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${policy.title || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${(policy.description || 'N/A').substring(0, 100)}${policy.description?.length > 100 ? '...' : ''}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: center; color: ${policy.documentUrl ? 'green' : 'red'}; font-weight: bold;">${policy.documentUrl ? 'Available' : 'Not Available'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${formatDate(policy.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 12px; border-top: 2px solid #bdc3c7; padding-top: 20px;">
          <p style="font-weight: bold; margin-bottom: 5px;">Generated by Company Management System</p>
          <p style="margin: 5px 0;">Report Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          <p style="margin: 5px 0;">Company: ${companyData.company?.name || 'N/A'}</p>
          <p style="margin: 5px 0; font-style: italic;">This is an automated report containing comprehensive company information.</p>
        </div>
      </div>
    `;

    // Create a temporary element
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    // Configure options for better PDF quality
    const options = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `${companyData.company?.name || 'Company'}_Complete_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        allowTaint: false
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Generate PDF
    html2pdf().set(options).from(element).save().then(() => {
      document.body.removeChild(element);
    });
  };

  // Rest of your existing code remains exactly the same...
  useEffect(() => {
    getCompanyList();
  }, []);

  const permissions = [
    "Add Sub-Admin","Add Employee", "Edit Employee", "Add Manager", "Payroll Manage",
    "Shift Management", "Shift Assign", "Attendence Assign", "Add Leave",
    "Leave Assign", "Leave Approval", "Leave Balance", "Rule", "History",
    "Policies", "Company Holidays", "New Joiners Form", "Resignation Setup",
    "Resignation Approval", "Self Evaluation (KRA)", "Employee master information",
    "CTC Structure", "Payments & Deductions", "Perquisites Investments",
    "Tax Computation", "Reimbursement", "Flexi", "Tax computation sheet",
    "Investments (All sections: BOC,BOD,24b,etc.)", "Payroll Calculation",
    "Employee Master Report", "CTC Structure Report", "Payments & Deductions Report",
    "Declaration", "Actuals", "Tax Computation Report", "Attendence Approval",
    "Reimbursement Report", "Flexi Report", "LIC/Credit Society Deductions",
    "Investments Report", "Payroll Calculation Report", "Attendence Report",
    "Leave Report", "Overtime Report", "Individual Report"
  ];

  const [givenPermissions, setGivenPermissions] = useState([]);
  const [editedCompany, setEditedCompany] = useState(null);

  const submitPermissionsHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("POST", PERMISSIONS_API, {
        companyId: selectedCompany.companyId,
        permissions: givenPermissions,
      });
      toast.success("Permissions updated successfully");
      getCompanyList();
      setIsPermissionModalOpen(false);
      setSelectedCompany(null);
      setGivenPermissions([]);
    } catch (error) {
      console.error("Permission update failed:", error);
      toast.error("Unable to update permissions");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCustomFieldChange = (index, key, value) => {
    const updated = [...editedCompany.customFields];
    updated[index][key] = value;
    setEditedCompany((prev) => ({ ...prev, customFields: updated }));
  };

  const addCustomField = () => {
    setEditedCompany((prev) => ({
      ...prev,
      customFields: [
        ...(prev.customFields || []),
        { label: "", name: "", type: "text", required: false },
      ],
    }));
  };

  const saveDtailsHandler = async (e) => {
    e.preventDefault();
    const form = new FormData();
    
    form.append("name", editedCompany.name);
    form.append("email", editedCompany.email);
    form.append("registrationNumber", editedCompany.registrationNumber);
    form.append("website", editedCompany.website);
    form.append("contactEmail", editedCompany.contactEmail);
    form.append("contactPhone", editedCompany.contactPhone);
    form.append("street", editedCompany.address?.street);
    form.append("city", editedCompany.address?.city);
    form.append("state", editedCompany.address?.state);
    form.append("pincode", editedCompany.address?.pincode);
    form.append("gstNumber", editedCompany.taxDetails?.gstNumber);
    form.append("panNumber", editedCompany.taxDetails?.panNumber);
    form.append("tanNumber", editedCompany.taxDetails?.tanNumber);
    form.append("accountNumber", editedCompany.bankDetails?.accountNumber);
    form.append("ifscCode", editedCompany.bankDetails?.ifscCode);
    form.append("accountHolderName", editedCompany.bankDetails?.accountHolderName);
    form.append("hrName", editedCompany.hrDetails?.name);
    form.append("hrEmail", editedCompany.hrDetails?.email);
    form.append("hrPhone", editedCompany.hrDetails?.phone);
    form.append("hrDesignation", editedCompany.hrDetails?.designation);
    form.append("customFields", JSON.stringify(editedCompany.customFields));
    form.append("thumbnail", editedCompany.thumbnail);

    try {
      dispatch(setLoading(true));
      const data = await apiConnector("POST", UPDATE_DETAILS_API + editedCompany._id, form);
      toast.success("Company details Updated successfully!");
      getCompanyList();
    } catch (error) {
      console.log(error);
      toast.error("Error in updating company details");
    } finally {
      dispatch(setLoading(false));
    }
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (selectedCompany) {
      setEditedCompany(JSON.parse(JSON.stringify(selectedCompany)));
    }
  }, [selectedCompany]);

  const filteredCompanies = companyList.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <Sidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[79vw] pr-4 pb-10">
        <SuperAdminHeader />
        <h2 className="text-3xl mt-4 font-semibold mb-6 text-center">
          Company List
        </h2>

        <input
          type="text"
          placeholder="Search by company name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6 px-4 ml-4 py-2 border border-gray-300 rounded w-full lg:w-1/2"
        />

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <div className="overflow-x-auto pl-4">
            <table className="min-w-full border border-gray-300 text-left">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-4 py-2">Company Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Edit</th>
                  <th className="px-4 py-2">Permissions</th>
                  <th className="px-4 py-2">Download PDF</th>
                  <th className="px-4 py-2">LogIn as Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company, index) => (
                  <tr key={index} className="border-t border-gray-300">
                    <td className="px-4 py-2">{company?.name}</td>
                    <td className="px-4 py-2">{company?.email}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          setEditedCompany(company);
                          setIsModalOpen(true);
                        }}
                        className="text-white h-[30px] w-[70px] flex justify-center items-center rounded-xl bg-blue-950 hover:underline"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setIsPermissionModalOpen(true);
                          setGivenPermissions(company.permissions || []);
                        }}
                        className="text-white h-[30px] w-[110px] flex justify-center items-center rounded-xl bg-blue-950 hover:underline"
                      >
                        Permissions
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => downloadCompanyDetails(company)}
                        className="text-white h-[30px] w-[130px] flex justify-center items-center rounded-xl bg-green-600 hover:bg-green-700 transition-colors"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="loader1"></div>
                        ) : (
                          "Download PDF"
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          
                          dispatch(setPermissions(company.permissions || []));
                          dispatch(setCompany(company));
                          dispatch(setReduxShifts(null));
                          dispatch(setReduxManagers(null));
                          dispatch(setReduxEmployee(company.adminUser));
                          dispatch(setReduxDepartments(null));
                          navigate("/adminpanel");
                        }}
                        className="text-white h-[30px] w-[170px] flex justify-center items-center rounded-xl bg-blue-950 hover:underline"
                      >
                        Login as Admin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Your existing modals remain exactly the same */}
        {/* Edit Modal */}
        {isModalOpen && editedCompany && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-6">Edit Company Details</h3>

              <form className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                {[
                  ["Company Name", "name"],
                  ["Company Email", "email"],
                  ["Registration Number", "registrationNumber"],
                  ["Website", "website"],
                  ["Contact Email", "contactEmail"],
                  ["Contact Phone", "contactPhone"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                {[
                  ["Street", "street"],
                  ["City", "city"],
                  ["State", "state"],
                  ["Country", "country"],
                  ["Pincode", "pincode"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany.address?.[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          address: { ...prev.address, [key]: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                {[
                  ["GST Number", "gstNumber"],
                  ["PAN Number", "panNumber"],
                  ["TAN Number", "tanNumber"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany.taxDetails?.[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          taxDetails: {
                            ...prev.taxDetails,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                {[
                  ["Account Holder", "accountHolderName"],
                  ["Account Number", "accountNumber"],
                  ["IFSC Code", "ifscCode"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany.bankDetails?.[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          bankDetails: {
                            ...prev.bankDetails,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                {[
                  ["HR Name", "name"],
                  ["HR Email", "email"],
                  ["HR Phone", "phone"],
                  ["HR Designation", "designation"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany.hrDetails?.[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          hrDetails: {
                            ...prev.hrDetails,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </form>

              <div className="md:col-span-2 mt-4">
                <label className="font-medium block mb-2">Change Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setEditedCompany((prev) => ({
                        ...prev,
                        thumbnail: file,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editedCompany.thumbnail && (
                  <img
                    src={
                      editedCompany?.thumbnail instanceof File
                        ? URL.createObjectURL(editedCompany.thumbnail)
                        : editedCompany?.thumbnail
                    }
                    alt="Thumbnail Preview"
                    className="h-24 rounded shadow mt-2"
                  />
                )}
              </div>

              <div className="md:col-span-2 mt-6">
                <label className="font-medium block mb-2">Custom Fields</label>
                {editedCompany.customFields?.map((field, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={field.label}
                      onChange={(e) =>
                        handleCustomFieldChange(index, "label", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Name"
                      value={field.name}
                      onChange={(e) =>
                        handleCustomFieldChange(index, "name", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Type"
                      value={field.type}
                      onChange={(e) =>
                        handleCustomFieldChange(index, "type", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          handleCustomFieldChange(index, "required", e.target.checked)
                        }
                        className="accent-blue-600"
                      />
                      Required
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomField}
                  className="mt-2 px-3 py-1 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  + Add Custom Field
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditedCompany(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDtailsHandler}
                  className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  {loading ? <div className="loader1"></div> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permission Modal */}
        {isPermissionModalOpen && selectedCompany && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
            <div className="bg-white w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">
                Manage Permissions for {selectedCompany.name}
              </h3>

              <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissions.map((perm, index) => (
                  <label key={index} className="flex gap-2 items-center text-sm">
                    <input
                      type="checkbox"
                      value={perm}
                      checked={givenPermissions.includes(perm)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const value = e.target.value;
                        if (checked) {
                          setGivenPermissions([...givenPermissions, value]);
                        } else {
                          setGivenPermissions(
                            givenPermissions.filter((p) => p !== value)
                          );
                        }
                      }}
                      className="accent-blue-700"
                    />
                    {perm}
                  </label>
                ))}
              </form>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPermissionsHandler}
                  className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyList;
