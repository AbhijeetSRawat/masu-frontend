import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ForHRTeams Component
const ForHRTeams = () => {
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

  const testimonials = [
    { name: "Priya Sharma", role: "HR Manager", text: "Masu Payroll streamlined our HR processes and saved us countless hours." },
    { name: "Rajeev Mehta", role: "HR Director", text: "Best payroll solution for HR teams managing 500+ employees." },
    { name: "Anjali Verma", role: "HR Business Partner", text: "Payroll compliance is now 100% automated. A must-have tool for HR!" }
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50 text-gray-900">
        <Header/>
      {/* Hero Section */}
      <section 
        id="section-hero"
        className="bg-gradient-to-br from-gray-700 via-blue-800 to-indigo-900 text-white text-center py-20"
      >
        <div style={fadeInUp('section-hero')}>
          <h1 className="text-5xl font-bold mb-4">HR Payroll Management, Simplified</h1>
          <div className="w-20 h-1 bg-yellow-400 mx-auto mb-6"></div>
          <p className="text-lg max-w-3xl mx-auto mb-8">
            A powerful tool for HR teams to manage salaries, benefits, & compliance effortlessly.
          </p>
          <button className="bg-yellow-400 text-black font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105">
            Try Masu Payroll
          </button>
        </div>
      </section>

      {/* HR Challenges */}
      <section id="section-challenges" className="max-w-6xl mx-auto py-20 px-6">
        <div style={fadeInUp('section-challenges')} className="text-center mb-12">
          <h2 className="text-4xl font-bold">HR Challenges & How We Solve Them</h2>
          <div className="w-20 h-1 bg-yellow-400 mx-auto mt-4"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div 
            style={fadeInUp('section-challenges', 100)}
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <h3 className="text-2xl font-semibold mb-3">
              <i className="fas fa-clock text-blue-500 mr-2"></i>Time-Consuming Payroll
            </h3>
            <p className="text-gray-600">Automated payroll processing saves 80% of manual work.</p>
          </div>
          <div 
            style={fadeInUp('section-challenges', 200)}
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <h3 className="text-2xl font-semibold mb-3">
              <i className="fas fa-file-invoice text-green-500 mr-2"></i>Compliance Risks
            </h3>
            <p className="text-gray-600">Auto-tax filing & compliance tracking ensures 100% legal adherence.</p>
          </div>
          <div 
            style={fadeInUp('section-challenges', 300)}
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <h3 className="text-2xl font-semibold mb-3">
              <i className="fas fa-users text-purple-500 mr-2"></i>Employee Data Management
            </h3>
            <p className="text-gray-600">HR teams can manage employee records in a single dashboard.</p>
          </div>
        </div>
      </section>

      {/* HR's Role */}
      <section id="section-role" className="bg-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div style={fadeInUp('section-role')} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">HR's Role in Modern Payroll Management</h2>
            <div className="w-20 h-1 bg-yellow-400 mx-auto mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div style={fadeInUp('section-role', 100)}>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  Human Resource (HR) teams are the backbone of an organization, responsible for managing employees'
                  salaries, benefits, tax compliance, and legal regulations. With evolving workplace dynamics and
                  remote workforces, payroll management has become more complex than ever.
                </p>
                <p>
                  Traditional payroll systems often involve <strong>manual calculations, delayed payments, and compliance
                  risks</strong>, making it challenging for HR teams to ensure accuracy. <strong>Automation-driven payroll
                  solutions</strong> not only simplify salary disbursements but also empower HR professionals with real-time
                  insights, customizable workflows, and seamless compliance tracking.
                </p>
                <p>
                  By integrating modern payroll software like <strong>Masu Payroll</strong>, HR teams can eliminate administrative
                  burdens and focus more on employee engagement, retention, and organizational growth.
                </p>
              </div>
            </div>
            <div style={fadeInUp('section-role', 200)} className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-8 shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-6xl text-center mb-4">👥</div>
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">HR Excellence</h3>
                  <p className="text-gray-600">Empowering HR teams with smart tools</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="section-integrations" className="max-w-6xl mx-auto py-20 px-6">
        <div style={fadeInUp('section-integrations')} className="text-center mb-12">
          <h2 className="text-4xl font-bold">Seamless Integrations with HR & Finance Tools</h2>
          <div className="w-20 h-1 bg-yellow-400 mx-auto mt-4"></div>
        </div>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "fas fa-building", name: "Tally", color: "text-blue-500" },
            { icon: "fas fa-calculator", name: "QuickBooks", color: "text-green-500" },
            { icon: "fas fa-credit-card", name: "Razorpay", color: "text-yellow-500" },
            { icon: "fas fa-user-tie", name: "Zoho HR", color: "text-purple-500" }
          ].map((integration, index) => (
            <div 
              key={index}
              style={fadeInUp('section-integrations', index * 100)}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <i className={`${integration.icon} ${integration.color} text-4xl mb-4`}></i>
              <h3 className="text-xl font-semibold">{integration.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="section-testimonials" className="bg-gradient-to-r from-gray-100 to-gray-200 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div style={fadeInUp('section-testimonials')} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">What HR Teams Say About Us</h2>
            <div className="w-20 h-1 bg-blue-500 mx-auto mt-4"></div>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div 
              style={fadeInUp('section-testimonials', 100)}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-300"
            >
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {testimonials[currentTestimonial].name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{testimonials[currentTestimonial].name}</h3>
                  <p className="text-gray-500 mb-2">{testimonials[currentTestimonial].role}</p>
                  <p className="text-gray-700 italic">"{testimonials[currentTestimonial].text}"</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentTestimonial === index ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export { ForHRTeams };