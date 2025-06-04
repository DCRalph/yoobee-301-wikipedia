"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    // alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold text-[#3a2a14]">
        Contact WikiClone
      </h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-6 text-2xl font-semibold text-[#3a2a14]">
            Get in Touch
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              {`We'd love to hear from you! Whether you have questions, feedback,
              or need support, don't hesitate to reach out to us.`}
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#3a2a14]">
                  General Inquiries
                </h3>
                <p>info@dcralph.com</p>
              </div>

              <div>
                <h3 className="font-semibold text-[#3a2a14]">
                  Technical Support
                </h3>
                <p>support@dcralph.com</p>
              </div>

              <div>
                <h3 className="font-semibold text-[#3a2a14]">
                  Business Partnerships
                </h3>
                <p>partnerships@dcralph.com</p>
              </div>

              <div>
                <h3 className="font-semibold text-[#3a2a14]">Office Hours</h3>
                <p>1-2 hours per year</p>
              </div>

              <div>
                <h3 className="font-semibold text-[#3a2a14]">Response Time</h3>
                <p>
                  We typically respond to inquiries within approximately 5
                  billion years (the estimated remaining lifespan of the
                  Sun){" "}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-6">
          <h2 className="mb-6 text-2xl font-semibold text-[#3a2a14]">
            Send us a Message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-[#3a2a14] focus:ring-[#3a2a14] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-[#3a2a14] focus:ring-[#3a2a14] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700"
              >
                Subject *
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-[#3a2a14] focus:ring-[#3a2a14] focus:outline-none"
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="feedback">Feedback</option>
                <option value="partnership">Business Partnership</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700"
              >
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe your inquiry or feedback..."
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-[#3a2a14] focus:ring-[#3a2a14] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[#3a2a14] px-4 py-2 text-white transition-colors hover:bg-[#2d1f0f] focus:ring-2 focus:ring-[#3a2a14] focus:ring-offset-2 focus:outline-none"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
