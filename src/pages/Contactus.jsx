import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.topic ||
      !formData.message
    ) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Message sent successfully! We'll get back to you shortly.");
        setFormData({ name: "", email: "", topic: "", message: "" });
      } else {
        alert(result.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              Contact Us
            </h2>

            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your company name"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Official Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your official email"
                />
              </div>

              {/* Topic */}
              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Topic
                </label>
                <select
                  name="topic"
                  id="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all duration-300"
                >
                  <option value="" className="text-gray-800">
                    -- Select Topic --
                  </option>
                  <option value="general" className="text-gray-800">
                    General Inquiry
                  </option>
                  <option value="support" className="text-gray-800">
                    Customer Support
                  </option>
                  <option value="feedback" className="text-gray-800">
                    Feedback
                  </option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all duration-300 resize-vertical"
                  placeholder="Your message here..."
                ></textarea>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full px-6 py-4 text-white bg-blue-800 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 hover:bg-blue-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-800"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
