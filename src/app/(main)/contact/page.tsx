"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Section header component to match Home.tsx
const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-6 flex items-center justify-center">
    <div className="h-px w-12 bg-[#c0a080]"></div>
    <h2 className="mx-4 text-center font-serif text-2xl font-medium">
      {title}
    </h2>
    <div className="h-px w-12 bg-[#c0a080]"></div>
  </div>
);

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert("Please fill in all required fields.");
      return;
    }

    // Handle form submission here
    console.log("Form submitted:", formData);
    // alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      subject: value,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container mx-auto my-12 px-4">
        <div className="text-center">
          <h1 className="mb-4 font-serif text-4xl font-bold text-[#3b2a1a] md:text-5xl">
            Contact WikiClone
          </h1>
          <p className="mx-auto max-w-2xl font-serif text-lg text-[#6b4c35]/80">
            We&apos;d love to hear from you! Whether you have questions, feedback, or need support, don&apos;t hesitate to reach out.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="container mx-auto my-16 px-4 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-6">
              <SectionHeader title="Get in Touch" />

              <div className="space-y-4">
                {/* Contact Info Cards */}
                <div className="group rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] hover:shadow-xl active:scale-95">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-[#8b6c55] to-[#6b4c35] text-white transition-all duration-200 group-hover:from-[#a67c5a] group-hover:to-[#8b6c55]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                        General Inquiries
                      </h3>
                      <p className="text-[#6b4c35]/80">info@dcralph.com</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] hover:shadow-xl active:scale-95">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-[#8b6c55] to-[#6b4c35] text-white transition-all duration-200 group-hover:from-[#a67c5a] group-hover:to-[#8b6c55]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                        Technical Support
                      </h3>
                      <p className="text-[#6b4c35]/80">support@dcralph.com</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] hover:shadow-xl active:scale-95">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-[#8b6c55] to-[#6b4c35] text-white transition-all duration-200 group-hover:from-[#a67c5a] group-hover:to-[#8b6c55]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                        Business Partnerships
                      </h3>
                      <p className="text-[#6b4c35]/80">partnerships@dcralph.com</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] hover:shadow-xl active:scale-95">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-[#8b6c55] to-[#6b4c35] text-white transition-all duration-200 group-hover:from-[#a67c5a] group-hover:to-[#8b6c55]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                        Office Hours
                      </h3>
                      <p className="text-[#6b4c35]/80">1-2 hours per year</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] hover:shadow-xl active:scale-95">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-[#8b6c55] to-[#6b4c35] text-white transition-all duration-200 group-hover:from-[#a67c5a] group-hover:to-[#8b6c55]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                        Response Time
                      </h3>
                      <p className="text-[#6b4c35]/80">
                        We typically respond within approximately 5 billion years (the estimated remaining lifespan of the Sun)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="space-y-6">
              <SectionHeader title="Send us a Message" />

              <div className="rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-8 shadow-lg transition-all duration-300 hover:border-[#d4c4b0] hover:shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block font-serif text-sm font-medium text-[#3b2a1a]"
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
                      className="block w-full rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] px-4 py-3 text-[#3b2a1a] shadow-sm transition-all duration-200 placeholder:text-[#6b4c35]/60 hover:border-[#d4c4b0] focus:border-[#8b6c55] focus:ring-2 focus:ring-[#8b6c55]/20 focus:outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block font-serif text-sm font-medium text-[#3b2a1a]"
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
                      className="block w-full rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] px-4 py-3 text-[#3b2a1a] shadow-sm transition-all duration-200 placeholder:text-[#6b4c35]/60 hover:border-[#d4c4b0] focus:border-[#8b6c55] focus:ring-2 focus:ring-[#8b6c55]/20 focus:outline-none"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="block font-serif text-sm font-medium text-[#3b2a1a]"
                    >
                      Subject *
                    </label>
                    <Select
                      value={formData.subject}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger className="w-full !h-12 rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] px-4 py-3 text-[#3b2a1a] shadow-sm transition-all duration-200 hover:border-[#d4c4b0] focus:border-[#8b6c55] focus:ring-2 focus:ring-[#8b6c55]/20 focus:outline-none [&>span]:text-[#6b4c35]/60 data-[state=open]:border-[#8b6c55]">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] shadow-xl">
                        <SelectItem value="general" className="hover:bg-[#f8f5f1] focus:bg-[#f8f5f1] text-[#3b2a1a] cursor-pointer">
                          General Inquiry
                        </SelectItem>
                        <SelectItem value="support" className="hover:bg-[#f8f5f1] focus:bg-[#f8f5f1] text-[#3b2a1a] cursor-pointer">
                          Technical Support
                        </SelectItem>
                        <SelectItem value="feedback" className="hover:bg-[#f8f5f1] focus:bg-[#f8f5f1] text-[#3b2a1a] cursor-pointer">
                          Feedback
                        </SelectItem>
                        <SelectItem value="partnership" className="hover:bg-[#f8f5f1] focus:bg-[#f8f5f1] text-[#3b2a1a] cursor-pointer">
                          Business Partnership
                        </SelectItem>
                        <SelectItem value="other" className="hover:bg-[#f8f5f1] focus:bg-[#f8f5f1] text-[#3b2a1a] cursor-pointer">
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="block font-serif text-sm font-medium text-[#3b2a1a]"
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
                      className="block w-full rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] px-4 py-3 text-[#3b2a1a] shadow-sm transition-all duration-200 placeholder:text-[#6b4c35]/60 hover:border-[#d4c4b0] focus:border-[#8b6c55] focus:ring-2 focus:ring-[#8b6c55]/20 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="group inline-flex items-center rounded-xl border-2 border-[#8b6c55] bg-linear-to-r from-[#8b6c55] to-[#6b4c35] px-8 py-3 font-serif font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[#a67c5a] hover:to-[#8b6c55] hover:shadow-xl active:scale-95 focus:ring-2 focus:ring-[#8b6c55]/20 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
