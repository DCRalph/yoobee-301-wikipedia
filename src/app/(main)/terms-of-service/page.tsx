export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold text-[#3a2a14]">
        Terms of Service
      </h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using WikiClone, you accept and agree to be bound
            by the terms and provision of this agreement. These Terms of Service
            apply to all visitors, users, and others who access or use the
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            2. Use License
          </h2>
          <p>
            Permission is granted to temporarily download one copy of WikiClone
            materials for personal, non-commercial transitory viewing only. This
            is the grant of a license, not a transfer of title, and under this
            license you may not:
          </p>
          <ul className="mt-2 ml-6 list-disc space-y-1">
            <li>modify or copy the materials</li>
            <li>
              use the materials for any commercial purpose or for any public
              display
            </li>
            <li>
              attempt to reverse engineer any software contained on the website
            </li>
            <li>
              remove any copyright or other proprietary notations from the
              materials
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            3. User Accounts
          </h2>
          <p>
            When you create an account with us, you must provide information
            that is accurate, complete, and current at all times. You are
            responsible for safeguarding the password and for keeping your
            account information up to date.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            4. Content
          </h2>
          <p>
            Our service allows you to post, link, store, share and otherwise
            make available certain information, text, graphics, videos, or other
            material. You are responsible for the content that you post to the
            service, including its legality, reliability, and appropriateness.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            5. Prohibited Uses
          </h2>
          <p>You may not use our service:</p>
          <ul className="mt-2 ml-6 list-disc space-y-1">
            <li>
              For any unlawful purpose or to solicit others to unlawful acts
            </li>
            <li>
              To violate any international, federal, provincial, or state
              regulations, rules, laws, or local ordinances
            </li>
            <li>
              To infringe upon or violate our intellectual property rights or
              the intellectual property rights of others
            </li>
            <li>
              To harass, abuse, insult, harm, defame, slander, disparage,
              intimidate, or discriminate
            </li>
            <li>To submit false or misleading information</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            6. Termination
          </h2>
          <p>
            We may terminate or suspend your account and bar access to the
            service immediately, without prior notice or liability, under our
            sole discretion, for any reason whatsoever and without limitation.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            7. Changes to Terms
          </h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material, we will provide
            at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#3a2a14]">
            8. Contact Information
          </h2>
          <p>
            If you have any questions about these Terms of Service, please
            contact us through our contact page.
          </p>
        </section>

        <div className="mt-8 border-t pt-6 text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
