import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TaxCompliance = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Hero Section */}
      <section className="relative h-96 bg-cover bg-center flex items-center justify-center text-white text-center">
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')"
          }}
        ></div>
        <div className="relative z-10 bg-black bg-opacity-50 p-8 rounded-lg">
          <h1 className="text-4xl font-bold">Tax & Compliance</h1>
          <p className="mt-2 text-lg">Stay compliant with the latest tax regulations and payroll laws.</p>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white rounded-lg shadow-lg mb-10">
        {/* Overview Section */}
        <section className="my-8">
          <h2 className="text-3xl font-semibold text-blue-900">Understanding Tax & Compliance</h2>
          <p className="mt-4 text-lg text-gray-700">
            Tax & Compliance in payroll ensures businesses adhere to government regulations, avoiding penalties and legal issues. 
            It is essential for organizations to maintain accurate records and timely submissions to remain compliant.
          </p>
        </section>

        {/* Key Compliance Requirements */}
        <section className="my-8 p-6 bg-gray-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900">Key Payroll Compliance Requirements</h2>
          <ul className="list-disc list-inside mt-4 text-lg text-gray-700 space-y-2">
            <li>Income Tax (TDS) deduction & timely filing.</li>
            <li>Provident Fund (PF) & Employee State Insurance (ESI) contributions.</li>
            <li>Professional Tax (PT) & labor law adherence.</li>
            <li>Gratuity & pension schemes compliance.</li>
            <li>Statutory bonus & minimum wage regulations.</li>
          </ul>
        </section>

        {/* Taxation Process */}
        <section className="my-8 p-6 bg-gray-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900">Payroll Taxation Process</h2>
          <p className="mt-4 text-lg text-gray-700">
            Payroll taxation includes calculating tax liabilities, deductions, and ensuring compliance with regulatory updates. 
            Understanding this process is crucial for accurate payroll management.
          </p>
          <ul className="list-disc list-inside mt-4 text-lg text-gray-700 space-y-2">
            <li><strong>Tax Deduction:</strong> Calculation of TDS, PF, ESI, and other statutory deductions.</li>
            <li><strong>Tax Filing:</strong> Employers must submit payroll tax returns on a monthly/quarterly basis.</li>
            <li><strong>Employee Tax Slabs:</strong> Adjusted according to income levels and government policies.</li>
            <li><strong>Year-End Compliance:</strong> Issuance of Form 16 and annual tax audits.</li>
          </ul>
        </section>

        {/* Challenges & Solutions */}
        <section className="my-8 p-6 bg-gray-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900">Challenges in Payroll Compliance & Solutions</h2>
          <ul className="list-disc list-inside mt-4 text-lg text-gray-700 space-y-2">
            <li><strong>Frequent Tax Updates:</strong> Businesses must stay informed about changing tax laws.</li>
            <li><strong>Payroll Errors:</strong> Automating payroll reduces human errors in calculations.</li>
            <li><strong>Legal Risks:</strong> Non-compliance can result in heavy fines and penalties.</li>
            <li><strong>Solution:</strong> Using modern payroll software ensures tax compliance and accurate reporting.</li>
          </ul>
        </section>

        {/* Best Practices */}
        <section className="my-8 p-6 bg-gray-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900">Best Practices for Payroll Compliance</h2>
          <ul className="list-disc list-inside mt-4 text-lg text-gray-700 space-y-2">
            <li>Regularly update tax rules in payroll systems.</li>
            <li>Use payroll automation to minimize compliance errors.</li>
            <li>Maintain detailed payroll records for audits.</li>
            <li>Ensure employees receive timely payslips and tax documents.</li>
          </ul>
        </section>

        {/* Importance of Tax Compliance */}
        <section className="my-8 p-6 bg-gray-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900">Importance of Tax Compliance</h2>
          <p className="mt-4 text-lg text-gray-700">
            Tax compliance is crucial for maintaining the financial health of a business. It helps in building trust with 
            employees and stakeholders, ensuring that the organization operates within the legal framework. Non-compliance 
            can lead to severe financial penalties and damage to the company's reputation.
          </p>
          <p className="mt-2 text-lg text-gray-700">
            Moreover, a compliant payroll system can enhance employee satisfaction, as timely and accurate salary payments 
            contribute to a positive work environment.
          </p>
        </section>

        {/* Impact of Non-Compliance */}
        <section className="my-8 p-6 bg-gray-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900">Impact of Non-Compliance</h2>
          <p className="mt-4 text-lg text-gray-700">
            Failing to comply with tax regulations can have serious consequences for businesses:
          </p>
          <ul className="list-disc list-inside mt-4 text-lg text-gray-700 space-y-2">
            <li>Heavy fines and penalties imposed by tax authorities.</li>
            <li>Legal action that can lead to business shutdowns.</li>
            <li>Loss of reputation and trust among employees and clients.</li>
            <li>Increased scrutiny from regulatory bodies, leading to more audits.</li>
          </ul>
        </section>

        {/* Resources for Staying Compliant */}
        <section className="my-8 p-6 bg-gray-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900">Resources for Staying Compliant</h2>
          <p className="mt-4 text-lg text-gray-700">
            To ensure compliance with tax regulations, businesses can utilize various resources:
          </p>
          <ul className="list-disc list-inside mt-4 text-lg text-gray-700 space-y-2">
            <li>Consulting with tax professionals or accountants for expert advice.</li>
            <li>Utilizing payroll software that is regularly updated with the latest tax laws.</li>
            <li>Participating in workshops and training sessions on tax compliance.</li>
            <li>Staying informed through government websites and tax authority publications.</li>
          </ul>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default TaxCompliance;
