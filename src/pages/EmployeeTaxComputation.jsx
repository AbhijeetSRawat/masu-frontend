import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import { apiConnector } from '../services/apiConnector';
import { taxCalculationEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaFileInvoiceDollar, FaChartPie, FaInfoCircle, FaCheckCircle, FaCalculator, FaRupeeSign, FaCalendarAlt } from 'react-icons/fa';

const EmployeeTaxComputation = () => {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

  const token = useSelector((state) => state.auth.token);
  const company = useSelector((state) => state.permissions.company);
  const employee = useSelector((state) => state.employees.reduxEmployee);

  useEffect(() => {
    if (employee?._id && company?._id) {
      fetchTaxComputation();
    }
  }, [employee?._id, company?._id, selectedFinancialYear]);

  const fetchTaxComputation = async () => {
    try {
      setLoading(true);
      const url = taxCalculationEndpoints.getTaxComputation
        .replace(':employeeId', employee._id)
        .replace(':companyId', company._id) + `?financialYear=${selectedFinancialYear}`;

      const response = await apiConnector(
        'GET',
        url,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data.success) {
        setTaxData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tax computation:', error);
      if (error.response?.status === 404) {
        toast.error('No tax computation found for this financial year');
        setTaxData(null);
      } else {
        toast.error('Failed to fetch tax computation');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 3; i++) {
      const year = currentYear - i;
      years.push({
        value: `${year}-${year + 1}`,
        label: `FY ${year}-${year + 1}`
      });
    }
    return years;
  };

  const getEmployeeName = () => {
    if (employee?.user?.profile?.firstName) {
      return `${employee.user.profile.firstName} ${employee.user.profile.lastName || ''}`.trim();
    }
    return 'Employee';
  };

  const getEmployeeId = () => {
    return employee?.employmentDetails?.employeeId || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex">
        <EmployeeSidebar />
        <div className="w-full lg:w-[80vw] lg:ml-[20vw]">
          <EmployeeHeader />
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tax computation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:w-[80vw] lg:ml-[20vw]">
        <EmployeeHeader />

        <div className="p-6 bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <FaFileInvoiceDollar className="text-3xl text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">Tax Computation</h1>
                  <p className="text-gray-600">View your income tax calculation and regime comparison</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <FaCalendarAlt className="text-blue-600" />
                <select
                  value={selectedFinancialYear}
                  onChange={(e) => setSelectedFinancialYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {getFinancialYears().map(year => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-blue-500 text-xl flex-shrink-0 mt-1" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-gray-800 mb-2">About Tax Computation:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tax is calculated based on your CTC, flexi declarations, and tax investments</li>
                    <li>Comparison between Old Tax Regime and New Tax Regime is provided</li>
                    <li>The system recommends the most beneficial tax regime for you</li>
                    <li>Contact HR if you need to update your tax declarations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {taxData ? (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-800">{getEmployeeName()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-semibold text-gray-800">{getEmployeeId()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold text-gray-800">
                      {employee?.employmentDetails?.department?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Financial Year</p>
                    <p className="font-semibold text-gray-800">{taxData.financialYear}</p>
                  </div>
                </div>
              </div>

              {/* Income Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <FaRupeeSign className="text-3xl opacity-80 mb-2" />
                  <h3 className="text-sm font-medium opacity-90">Gross Salary</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(taxData.calculationSummary.grossSalary)}</p>
                  <p className="text-xs opacity-75 mt-1">Annual Income</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                  <FaCalculator className="text-3xl opacity-80 mb-2" />
                  <h3 className="text-sm font-medium opacity-90">Total Exemptions</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(taxData.calculationSummary.totalExemptions)}</p>
                  <p className="text-xs opacity-75 mt-1">Tax Benefits</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                  <FaChartPie className="text-3xl opacity-80 mb-2" />
                  <h3 className="text-sm font-medium opacity-90">Total Deductions</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(taxData.calculationSummary.totalDeductions)}</p>
                  <p className="text-xs opacity-75 mt-1">Section 80C, etc.</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                  <FaFileInvoiceDollar className="text-3xl opacity-80 mb-2" />
                  <h3 className="text-sm font-medium opacity-90">Taxable Income</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(taxData.calculationSummary.netTaxableIncome)}</p>
                  <p className="text-xs opacity-75 mt-1">After Deductions</p>
                </div>
              </div>

              {/* Tax Regime Comparison */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Tax Regime Comparison</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Old Regime */}
                  <div className={`border-2 rounded-lg p-6 ${
                    taxData.calculationSummary.recommendedRegime === 'old' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-gray-800 text-lg">Old Tax Regime</h5>
                      {taxData.calculationSummary.recommendedRegime === 'old' && (
                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                          <FaCheckCircle /> Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-4xl font-bold text-gray-800 mb-2">
                      {formatCurrency(taxData.calculationSummary.oldRegimeTax)}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">Annual Tax Liability</p>
                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Monthly Deduction:</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatCurrency(taxData.calculationSummary.oldRegimeTax / 12)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      With exemptions & deductions under Section 80C, 80D, HRA, etc.
                    </p>
                  </div>

                  {/* New Regime */}
                  <div className={`border-2 rounded-lg p-6 ${
                    taxData.calculationSummary.recommendedRegime === 'new' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-gray-800 text-lg">New Tax Regime</h5>
                      {taxData.calculationSummary.recommendedRegime === 'new' && (
                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                          <FaCheckCircle /> Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-4xl font-bold text-gray-800 mb-2">
                      {formatCurrency(taxData.calculationSummary.newRegimeTax)}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">Annual Tax Liability</p>
                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Monthly Deduction:</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatCurrency(taxData.calculationSummary.newRegimeTax / 12)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Lower tax rates but no exemptions or deductions
                    </p>
                  </div>
                </div>

                {/* Tax Savings */}
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">Tax Difference (Annual):</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {formatCurrency(Math.abs(taxData.calculationSummary.oldRegimeTax - taxData.calculationSummary.newRegimeTax))}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Monthly: {formatCurrency(Math.abs(taxData.calculationSummary.oldRegimeTax - taxData.calculationSummary.newRegimeTax) / 12)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">You save more with:</p>
                      <p className="text-lg font-bold text-blue-700">
                        {taxData.calculationSummary.recommendedRegime === 'old' ? 'Old Regime' : 'New Regime'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Tax Liability */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <p className="text-blue-100 text-sm mb-1">
                      Final Tax Liability ({taxData.calculationSummary.recommendedRegime.toUpperCase()} Regime)
                    </p>
                    <p className="text-5xl font-bold mt-2">{formatCurrency(taxData.calculationSummary.finalTaxLiability)}</p>
                    <p className="text-blue-100 text-sm mt-2">Annual Tax (Including 4% Cess)</p>
                    <p className="text-blue-200 text-lg mt-2 font-semibold">
                      Monthly TDS: {formatCurrency(taxData.calculationSummary.finalTaxLiability / 12)}
                    </p>
                  </div>
                  <FaCheckCircle className="text-8xl text-blue-300 mt-4 md:mt-0" />
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaInfoCircle className="text-blue-600" />
                  Tax Optimization Tips
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                    <FaCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        The {taxData.calculationSummary.recommendedRegime.toUpperCase()} Tax Regime is recommended for you
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        This regime provides a saving of {formatCurrency(Math.abs(taxData.calculationSummary.oldRegimeTax - taxData.calculationSummary.newRegimeTax))} annually compared to the other regime.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <FaInfoCircle className="text-blue-600 text-xl flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">Tax Savings Opportunities</p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                        <li>Maximize Section 80C investments (up to ₹1.5 lakhs) - PPF, ELSS, Life Insurance</li>
                        <li>Claim HRA exemption if paying rent (keep rent receipts)</li>
                        <li>Invest in NPS for additional ₹50,000 deduction under 80CCD(1B)</li>
                        <li>Health insurance premium under Section 80D (₹25,000 for self, ₹50,000 for parents)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <FaInfoCircle className="text-yellow-600 text-xl flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">Important Notes</p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                        <li>Submit investment proofs to HR before the deadline</li>
                        <li>Review and update your tax declarations quarterly</li>
                        <li>Once chosen, the tax regime cannot be changed during the financial year</li>
                        <li>Contact HR for any queries regarding tax calculations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Computation Status</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                      taxData.status === 'calculated' ? 'bg-blue-100 text-blue-700' :
                      taxData.status === 'approved' ? 'bg-green-100 text-green-700' :
                      taxData.status === 'locked' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {taxData.status.charAt(0).toUpperCase() + taxData.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Calculated On</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(taxData.calculatedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FaFileInvoiceDollar className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Tax Computation Available</h3>
              <p className="text-gray-600 mb-4">
                Tax computation for {selectedFinancialYear} is not available yet.
              </p>
              <p className="text-sm text-gray-500">
                Please contact HR to calculate your tax. Make sure your CTC and tax declarations are up to date.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTaxComputation;
