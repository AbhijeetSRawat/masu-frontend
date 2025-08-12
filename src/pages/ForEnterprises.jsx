import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";

// ForEnterprises Component
const ForEnterprises = () => {
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: true
          }));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    const elements = document.querySelectorAll('[id^="section-"]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const fadeInUp = (id, delay = 0) => ({
    transform: isVisible[id] ? 'translateY(0)' : 'translateY(30px)',
    opacity: isVisible[id] ? 1 : 0,
    transition: `all 0.8s ease-out ${delay}ms`
  });

  return (
    <div className="bg-gray-50 text-gray-900">
        <Header/>
      {/* Hero Section */}
      <section 
        id="section-hero"
        className="bg-gradient-to-br from-gray-800 via-gray-700 to-blue-900 text-white text-center py-20"
      >
        <div style={fadeInUp('section-hero')}>
          <h1 className="text-5xl font-bold mb-4">Enterprise Payroll, Simplified</h1>
          <div className="w-20 h-1 bg-yellow-400 mx-auto mb-6"></div>
          <p className="text-lg max-w-3xl mx-auto mb-8">
            Managing payroll for thousands of employees shouldn't be a challenge.
            Masu Payroll automates complex payroll workflows, reduces compliance risks, and saves time for enterprises.
          </p>
          <button className="bg-yellow-400 text-black font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105">
            Get an Enterprise Demo
          </button>
        </div>
      </section>

      {/* Enterprise Complexity */}
      <section id="section-complexity" className="max-w-6xl mx-auto py-20 px-6">
        <div style={fadeInUp('section-complexity')} className="text-center mb-12">
          <h2 className="text-4xl font-bold">Why Enterprise Payroll is Complex?</h2>
          <div className="w-20 h-1 bg-yellow-400 mx-auto mt-4 mb-6"></div>
          <p className="text-lg text-gray-700">
            Enterprises face challenges like multi-country compliance, high payroll costs, and scalability issues.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div 
            style={fadeInUp('section-complexity', 100)}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <h3 className="text-2xl font-semibold mb-3">📑 Multi-Country Compliance</h3>
            <p className="text-gray-600">Each country has unique tax laws that enterprises must comply with.</p>
          </div>
          <div 
            style={fadeInUp('section-complexity', 200)}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <h3 className="text-2xl font-semibold mb-3">💰 High Payroll Costs</h3>
            <p className="text-gray-600">Manual payroll processing leads to massive operational costs.</p>
          </div>
          <div 
            style={fadeInUp('section-complexity', 300)}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <h3 className="text-2xl font-semibold mb-3">🚀 Scalability Challenges</h3>
            <p className="text-gray-600">Traditional payroll systems fail when employee count grows exponentially.</p>
          </div>
        </div>
      </section>

      {/* Tailored Solutions */}
      <section id="section-tailored" className="bg-gradient-to-r from-gray-100 to-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div style={fadeInUp('section-tailored')} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Tailored Payroll Solutions for Enterprises</h2>
            <div className="w-20 h-1 bg-yellow-400 mx-auto mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div style={fadeInUp('section-tailored', 100)}>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Every enterprise operates differently, and payroll should adapt to your business, not the other way
                around. Masu Payroll offers <strong>flexible customization</strong> options to fit your unique payroll workflows.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <h3 className="text-xl font-semibold mb-2">
                    <i className="fas fa-robot text-blue-500 mr-2"></i>AI-Based Automation
                  </h3>
                  <p className="text-gray-600">Automate payroll cycles & tax calculations with AI precision.</p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <h3 className="text-xl font-semibold mb-2">
                    <i className="fas fa-user-shield text-green-500 mr-2"></i>Role-Based Access
                  </h3>
                  <p className="text-gray-600">Define payroll access levels for HR, Finance, & Admin teams.</p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <h3 className="text-xl font-semibold mb-2">
                    <i className="fas fa-cogs text-yellow-500 mr-2"></i>Custom Workflows
                  </h3>
                  <p className="text-gray-600">Build personalized payroll workflows based on department needs.</p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <h3 className="text-xl font-semibold mb-2">
                    <i className="fas fa-lock text-red-500 mr-2"></i>Advanced Security
                  </h3>
                  <p className="text-gray-600">Bank-level encryption & compliance for secure payroll management.</p>
                </div>
              </div>
            </div>
            <div style={fadeInUp('section-tailored', 200)} className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-8 shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-6xl text-center mb-4">🏢</div>
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">Enterprise Ready</h3>
                  <p className="text-gray-600">Built for scale and complexity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Future of Automation */}
      <section id="section-future" className="max-w-6xl mx-auto py-16 px-6 text-center">
        <div style={fadeInUp('section-future')}>
          <h2 className="text-4xl font-bold mb-4">The Future of Payroll Automation in Enterprises</h2>
          <div className="w-20 h-1 bg-yellow-400 mx-auto mb-8"></div>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-12">
            AI-driven payroll automation is the future. Enterprises can leverage AI to optimize tax calculations,
            predictive payroll forecasting, and real-time financial analytics.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div 
            style={fadeInUp('section-future', 100)}
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <i className="fas fa-robot text-blue-500 text-4xl mb-4"></i>
            <h3 className="text-xl font-semibold">AI-Driven Tax Optimization</h3>
          </div>
          <div 
            style={fadeInUp('section-future', 200)}
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <i className="fas fa-chart-pie text-yellow-500 text-4xl mb-4"></i>
            <h3 className="text-xl font-semibold">Predictive Payroll Analytics</h3>
          </div>
          <div 
            style={fadeInUp('section-future', 300)}
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <i className="fas fa-cloud text-green-500 text-4xl mb-4"></i>
            <h3 className="text-xl font-semibold">Cloud-Based Security & Compliance</h3>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export { ForEnterprises };