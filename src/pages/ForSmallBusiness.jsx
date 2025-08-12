import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ForSmallBusiness Component
const ForSmallBusiness = () => {
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
        className="relative text-white bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 h-96 flex flex-col justify-center items-center text-center px-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10" style={fadeInUp('section-hero')}>
          <h1 className="text-5xl font-bold mb-4">Payroll Solutions for Small Businesses</h1>
          <p className="text-lg mb-6">Smart, affordable & automated payroll for startups & SMEs.</p>
          <button className="bg-yellow-400 text-black font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Key Payroll Challenges */}
      <section id="section-challenges" className="max-w-6xl mx-auto py-16 px-6">
        <div style={fadeInUp('section-challenges')} className="text-center mb-12">
          <h2 className="text-4xl font-bold">Key Payroll Challenges for Small Businesses</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          <div 
            style={fadeInUp('section-challenges', 100)}
            className="flex space-x-4 bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <i className="fas fa-clock text-4xl text-blue-900"></i>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Time-Consuming Processes</h3>
              <p className="text-gray-600">Manual payroll takes too much time every month.</p>
            </div>
          </div>
          <div 
            style={fadeInUp('section-challenges', 200)}
            className="flex space-x-4 bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <i className="fas fa-exclamation-triangle text-4xl text-blue-900"></i>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Compliance Risks</h3>
              <p className="text-gray-600">Small errors in tax filing can lead to penalties.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Empowering Small Businesses */}
      <section id="section-empowering" className="max-w-6xl mx-auto py-16 px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div style={fadeInUp('section-empowering')}>
            <h2 className="text-4xl font-bold mb-6">Empowering Small Businesses with Smart Payroll Solutions</h2>
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                Managing payroll manually can be overwhelming, especially for small businesses with limited resources.
                Masu Payroll takes the complexity out of salary processing, tax deductions, and compliance, allowing
                business owners to focus on growth.
              </p>
              <p>
                Our automated system ensures that your employees are paid accurately and on time while staying compliant
                with tax regulations. Whether you're a startup or a growing business, our user-friendly payroll solution
                adapts to your needs.
              </p>
            </div>
          </div>
          <div style={fadeInUp('section-empowering', 200)} className="relative">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-8 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="text-6xl text-center mb-4">📊</div>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Smart Analytics</h3>
                <p className="text-gray-600">Real-time payroll insights for better decisions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="section-faq" className="bg-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div style={fadeInUp('section-faq')} className="text-center mb-12">
            <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <details 
              style={fadeInUp('section-faq', 100)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <summary className="text-lg font-semibold cursor-pointer flex justify-between items-center">
                How does Masu Payroll save time?
                <i className="fas fa-chevron-down text-blue-900"></i>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Masu Payroll automates salary calculations, tax deductions, and payments, reducing hours of manual work.
              </p>
            </details>
            <details 
              style={fadeInUp('section-faq', 200)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <summary className="text-lg font-semibold cursor-pointer flex justify-between items-center">
                Is my data secure?
                <i className="fas fa-chevron-down text-blue-900"></i>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Yes, we use bank-grade encryption and compliance measures to ensure 100% security.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="section-cta" className="bg-blue-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div style={fadeInUp('section-cta')}>
            <h2 className="text-4xl font-bold mb-6">Take control of all your HR operations and experience the difference!</h2>
            <button className="bg-yellow-400 text-black font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105">
              Get a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Why Smart Payroll */}
      <section id="section-smart" className="max-w-6xl mx-auto py-16 px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div style={fadeInUp('section-smart')} className="relative">
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-8 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="text-6xl text-center mb-4">🚀</div>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Growth Focused</h3>
                <p className="text-gray-600">Scale your payroll with your business</p>
              </div>
            </div>
          </div>
          <div style={fadeInUp('section-smart', 200)}>
            <h2 className="text-4xl font-bold mb-6">Why Small Businesses Need Smart Payroll?</h2>
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                Payroll is one of the most critical yet time-consuming tasks for small businesses. Manually handling
                salaries, tax deductions, and compliance takes hours every month.
              </p>
              <p>
                With an automated payroll system, you can process salaries in minutes, ensure accurate tax calculations,
                and eliminate compliance risks. No more delays, no more errors – just seamless payroll management.
              </p>
              <p>
                Whether you're a startup or a growing company, investing in a smart payroll solution saves time, reduces
                costs, and keeps your business legally compliant.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};




// Export all components
export { ForSmallBusiness };