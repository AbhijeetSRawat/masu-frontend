import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const WhyUs = () => {
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: true,
          }));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: "50px",
    });

    const elements = document.querySelectorAll('[id^="section-"]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const fadeInUp = (id, delay = 0) => ({
    transform: isVisible[id] ? "translateY(0)" : "translateY(30px)",
    opacity: isVisible[id] ? 1 : 0,
    transition: `all 0.8s ease-out ${delay}ms`,
  });

  const stats = [
    { number: "1M+", label: "Payrolls Processed" },
    { number: "99.9%", label: "Accuracy in Payouts" },
    { number: "10,000+", label: "Businesses Trust Us" },
  ];

  const workSteps = [
    {
      title: "Step 1: Add Employees",
      description:
        "Easily onboard employees and set up salary structures in minutes.",
    },
    {
      title: "Step 2: Process Payroll",
      description:
        "Automated payroll calculations ensure accurate tax deductions.",
    },
    {
      title: "Step 3: Payout & Compliance",
      description:
        "Salary disbursement & tax compliance handled with one click.",
    },
  ];

  const userTypes = [
    {
      emoji: "🏢",
      title: "Small Businesses",
      description: "Ideal for startups & SMBs managing limited staff payroll.",
    },
    {
      emoji: "🏦",
      title: "Enterprises",
      description: "Scalable payroll management for large organizations.",
    },
    {
      emoji: "📈",
      title: "Freelancers",
      description: "Easily manage invoices, payments & deductions.",
    },
    {
      emoji: "🌎",
      title: "Global Companies",
      description: "Multi-currency & remote payroll processing.",
    },
  ];

  return (
    <div>

        <Header/>

      <div className="bg-gray-50 text-gray-900">
        {/* Hero Section */}
        <section
          id="section-hero"
          className="relative text-center py-20 text-white bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 overflow-hidden"
        >
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div
            className="relative max-w-4xl mx-auto px-6"
            style={fadeInUp("section-hero")}
          >
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">
              Why Choose MASU CONSULTANCY?
            </h1>
            <p className="text-xl leading-relaxed mb-8 text-blue-100">
              Elevate your payroll experience with automated salary processing,
              tax compliance, and seamless integrations – designed for
              businesses of all sizes.
            </p>
            <button className="bg-yellow-400 text-blue-900 font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105">
              Start Your Free Trial
            </button>
          </div>
        </section>

        {/* About Us Section */}
        <section id="section-about" className="max-w-6xl mx-auto py-20 px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div style={fadeInUp("section-about")}>
              <h2 className="text-4xl font-bold mb-6 text-gray-800">
                About Masu Payroll
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Masu Payroll is a revolutionary payroll management platform
                built to simplify salary processing, tax compliance, and
                employee benefits. Since our inception, we have empowered
                thousands of businesses to automate their payroll operations
                with 100% accuracy.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our mission is to create a hassle-free, efficient, and secure
                payroll experience for companies of all sizes, ensuring every
                employee gets paid correctly and on time.
              </p>
            </div>
            <div style={fadeInUp("section-about", 200)} className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-8 shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-6xl text-center mb-4">💼</div>
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    Professional Excellence
                  </h3>
                  <p className="text-gray-600">
                    Trusted by businesses worldwide
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Masu Payroll Works */}
        <section id="section-how" className="max-w-6xl mx-auto py-20 px-6">
          <div style={fadeInUp("section-how")} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800">
              How Masu Payroll Works?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {workSteps.map((step, index) => (
              <div
                key={index}
                style={fadeInUp("section-how", index * 100)}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-900 text-white rounded-lg flex items-center justify-center font-bold text-lg mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Businesses Love Section */}
        <section
          id="section-love"
          className="bg-gradient-to-r from-gray-100 to-gray-200 py-20"
        >
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div style={fadeInUp("section-love")}>
              <h2 className="text-4xl font-bold mb-8 text-gray-800">
                Why Businesses Love Masu Payroll
              </h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  In today's fast-paced world, businesses cannot afford payroll
                  delays or compliance errors. Masu Payroll provides an{" "}
                  <strong>automated, cloud-based, and highly secure</strong>{" "}
                  payroll solution that integrates with accounting, HR, and
                  taxation systems. Our system is designed to help{" "}
                  <strong>startups, SMBs, and enterprises</strong> manage their
                  payroll efficiently without worrying about complex
                  calculations, tax deductions, or data security.
                </p>
                <p>
                  With{" "}
                  <strong>
                    real-time analytics, multi-currency support, and seamless
                    banking integrations
                  </strong>
                  , Masu Payroll ensures you save time and reduce errors while
                  providing a great payroll experience to your employees.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who Can Use Section */}
        <section id="section-users" className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div
              style={fadeInUp("section-users")}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-800">
                Who Can Use Masu Payroll?
              </h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {userTypes.map((user, index) => (
                <div
                  key={index}
                  style={fadeInUp("section-users", index * 100)}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {user.emoji}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">
                    {user.title}
                  </h3>
                  <p className="text-gray-600">{user.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section id="section-stats" className="bg-yellow-400 py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div style={fadeInUp("section-stats")} className="mb-12">
              <h2 className="text-4xl font-bold text-blue-900">
                Payroll Statistics & Achievements
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  style={fadeInUp("section-stats", index * 200)}
                  className="bg-white bg-opacity-20 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105"
                >
                  <h3 className="text-4xl font-bold text-blue-900 mb-2">
                    {stat.number}
                  </h3>
                  <p className="text-blue-900 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer/>
    </div>
  );
};

export default WhyUs;
