export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold text-[#3a2a14]">Privacy Policy</h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <p className="mb-6 text-lg">
            At WikiClone, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, and protect your information when you
            use our service.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            1. Information We Collect
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">Personal Information</h3>
              <p>
                When you create an account, we collect information such as your
                name, email address, and any profile information you choose to
                provide.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-medium">Usage Information</h3>
              <p>
                We collect information about how you use our service, including
                pages visited, searches performed, and articles viewed.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-medium">Device Information</h3>
              <p>
                We may collect information about the device you use to access
                our service, including IP address, browser type, and operating
                system.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            2. How We Use Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="mt-2 ml-6 list-disc space-y-1">
            <li>Provide and maintain our service</li>
            <li>Improve and personalize your experience</li>
            <li>Communicate with you about updates and changes</li>
            <li>Ensure the security and integrity of our platform</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            3. Information Sharing
          </h2>
          <p>
            We do not sell, trade, or rent your personal information to third
            parties. We may share your information only in the following
            circumstances:
          </p>
          <ul className="mt-2 ml-6 list-disc space-y-1">
            <li>With your explicit consent</li>
            <li>To comply with legal processes or government requests</li>
            <li>To protect our rights, property, or safety</li>
            <li>With service providers who help us operate our platform</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            4. Data Security
          </h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. However, no method of
            transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            5. Cookies and Tracking
          </h2>
          <p>
            We use cookies and similar tracking technologies to enhance your
            experience on our website. You can control cookie settings through
            your browser preferences.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            6. Your Rights
          </h2>
          <p>You have the right to:</p>
          <ul className="mt-2 ml-6 list-disc space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict the processing of your information</li>
            <li>Data portability where applicable</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            {`7. Children's Privacy`}
          </h2>
          <p>
            Our service is not intended for children under 13 years of age. We
            do not knowingly collect personal information from children under
            13. If we become aware that we have collected such information, we
            will take steps to delete it.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            8. Changes to This Policy
          </h2>
          <p>
            {`We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last updated" date below.`}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            9. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us through our contact page or email us directly.
          </p>
        </section>

        <div className="mt-8 border-t pt-6 text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
