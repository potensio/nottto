export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-serif text-5xl mb-4">Terms of Service</h1>
        <p className="text-neutral-600 mb-8">Last updated: January 27, 2025</p>

        <div className="prose prose-neutral max-w-none">
          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Agreement to Terms</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              By accessing or using Notto, you agree to be bound by these Terms
              of Service. If you disagree with any part of these terms, you may
              not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Description of Service</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Notto is a screenshot annotation tool that allows you to capture,
              annotate, and share screenshots. The service includes a Chrome
              extension and web application for managing your screenshots and
              integrations with third-party project management tools.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">User Accounts</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>
                Maintaining the confidentiality of your account credentials
              </li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Acceptable Use</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>
                Upload content that infringes on intellectual property rights
              </li>
              <li>
                Capture or share screenshots containing sensitive personal
                information of others without consent
              </li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the service to transmit malware or harmful code</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Content Ownership</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              You retain all rights to the screenshots and annotations you
              create. By using Notto, you grant us a limited license to store
              and process your content solely for the purpose of providing the
              service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">
              Third-Party Integrations
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              When you configure webhook integrations with third-party services,
              you are responsible for complying with those services' terms of
              use. We are not responsible for the actions or policies of
              third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Service Availability</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We strive to maintain high availability but do not guarantee
              uninterrupted access to the service. We reserve the right to
              modify or discontinue the service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">
              Limitation of Liability
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Notto is provided "as is" without warranties of any kind. We are
              not liable for any damages arising from your use of the service,
              including but not limited to data loss, service interruptions, or
              third-party actions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Termination</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We reserve the right to terminate or suspend your account at any
              time for violations of these terms. You may terminate your account
              at any time through the dashboard.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Changes to Terms</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We may update these Terms of Service from time to time. Continued
              use of the service after changes constitutes acceptance of the new
              terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Contact</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              For questions about these Terms of Service, contact us at:
            </p>
            <p className="text-neutral-700 leading-relaxed">
              Email:{" "}
              <a
                href="mailto:support@notto.app"
                className="text-orange-600 hover:underline"
              >
                support@notto.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
