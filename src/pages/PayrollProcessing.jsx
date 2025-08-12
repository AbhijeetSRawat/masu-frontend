import React from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

const PayrollProcessing = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Hero Section */}
      <section className="relative text-white">
        <div
          className="bg-cover bg-center h-96 flex flex-col justify-center items-center text-center px-6"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')"
          }}
        >
          <h1 className="text-5xl font-bold text-white mb-4">Payroll Processing</h1>
          <p className="text-xl text-gray-200">
            Streamline your payroll operations with our comprehensive solutions.
          </p>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white rounded-lg shadow-lg mb-10">
        <header className="text-center bg-blue-900 text-white py-6 rounded-lg mb-8">
          <h1 className="text-4xl font-bold">Payroll Processing</h1>
          <p className="mt-2 text-lg">
            Streamline your payroll operations with our comprehensive solutions.
          </p>
        </header>

        {/* Sections */}
        {[
          {
            title: 'Understanding Payroll Processing',
            content: [
              'Payroll processing involves calculating and distributing salaries, ensuring tax compliance, and maintaining records. A streamlined payroll system helps businesses operate efficiently and keeps employees satisfied.',
              'Modern payroll systems integrate with HR and accounting platforms, making financial tracking seamless. This integration allows for real-time updates and reduces the chances of errors that can occur with manual data entry.'
            ],
            highlight: 'A reliable payroll system reduces errors, enhances compliance, and improves employee trust.'
          },
          {
            title: 'How Payroll Works',
            list: [
              'Employee Data Management: Storing details like salary structure, tax information, and benefits.',
              'Salary Calculation: Computing pay, bonuses, and deductions.',
              'Tax Deductions: Applying statutory deductions like TDS, PF, and ESI.',
              'Payment Processing: Transferring salaries via integrated banking systems.',
              'Payslip Generation: Issuing transparent digital payslips.',
              'Payroll Auditing: Reviewing records for accuracy and compliance.'
            ]
          },
          {
            title: 'Challenges in Payroll Processing',
            list: [
              'Keeping up with changing tax regulations.',
              'Ensuring timely and accurate salary disbursement.',
              'Managing payroll for remote employees in multiple locations.',
              'Preventing errors in calculations and deductions.'
            ]
          },
          {
            title: 'Key Components of Payroll',
            list: [
              'Basic Salary: Fixed earnings forming the compensation base.',
              'Bonuses & Allowances: Incentives like travel and overtime pay.',
              'Deductions: Contributions like PF, health insurance, taxes.',
              'Gross & Net Pay: Pre- and post-deduction salary values.'
            ]
          },
          {
            title: 'Payroll Compliance & Taxation',
            list: [
              'Income Tax (TDS): Accurate calculation and deduction.',
              'Provident Fund (PF) & ESI: Mandatory contributions.',
              'Maintaining tax filings and reports per labor laws.',
              'Keeping detailed payroll records for audits.'
            ]
          },
          {
            title: 'Modern Payroll Solutions',
            list: [
              'Cloud-based access with real-time updates.',
              'Automated tax compliance tracking.',
              'Employee self-service portals for payslips.',
              'Banking integration for payments.',
              'Advanced analytics and reporting.'
            ]
          },
          {
            title: 'Benefits of Payroll Automation',
            list: [
              'Time Savings: Reduces manual work.',
              'Increased Accuracy: Minimizes errors.',
              'Enhanced Compliance: Adapts to regulation changes.',
              'Improved Employee Satisfaction: Timely, accurate disbursement.',
              'Cost Efficiency: Less manual labor, fewer penalties.'
            ]
          }
        ].map((section, index) => (
          <section
            key={index}
            className="my-8 p-6 bg-gray-50 rounded-lg shadow-md"
          >
            <h2 className="text-2xl font-semibold text-blue-900">
              {section.title}
            </h2>
            {section.content &&
              section.content.map((text, i) => (
                <p key={i} className="mt-4 text-lg text-gray-700">
                  {text}
                </p>
              ))}
            {section.highlight && (
              <div className="mt-4 p-4 bg-blue-100 border-l-4 border-blue-600 text-blue-900 font-semibold">
                {section.highlight}
              </div>
            )}
            {section.list && (
              <ul className="list-disc list-inside mt-4 text-lg text-gray-700 space-y-2">
                {section.list.map((item, i) => (
                  <li key={i}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default PayrollProcessing;
