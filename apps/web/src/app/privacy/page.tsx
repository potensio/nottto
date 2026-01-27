export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-serif text-5xl mb-4">Privacy Policy</h1>
        <p className="text-neutral-600 mb-8">Last updated: January 27, 2025</p>

        <div className="prose prose-neutral max-w-none">
          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Introduction</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Notto ("we", "our", or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, and
              safeguard your information when you use our Chrome extension and
              web application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Information We Collect</h2>

            <h3 className="font-semibold text-xl mb-3 mt-6">
              Personal Information
            </h3>
            <p className="text-neutral-700 leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Password (stored as a secure hash)</li>
              <li>Profile picture (optional)</li>
            </ul>

            <h3 className="font-semibold text-xl mb-3 mt-6">
              Screenshot and Annotation Data
            </h3>
            <p className="text-neutral-700 leading-relaxed mb-4">
              When you use Notto, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Screenshots you capture</li>
              <li>Annotations you create (drawings, text, shapes)</li>
              <li>Page URLs and titles of captured screenshots</li>
              <li>Workspace and project organization data</li>
            </ul>

            <h3 className="font-semibold text-xl mb-3 mt-6">
              Authentication Information
            </h3>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We use JWT (JSON Web Tokens) to maintain your session. These
              tokens are stored locally in your browser and are used to
              authenticate API requests.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">
              How We Use Your Information
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We use the collected information solely for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Providing and maintaining the Notto service</li>
              <li>Authenticating your account and managing your sessions</li>
              <li>Storing and organizing your screenshots and annotations</li>
              <li>
                Sending screenshots to your configured webhook integrations
                (Linear, Asana, Jira, etc.)
              </li>
              <li>Improving our service and user experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">
              Data Storage and Security
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Your data is stored securely:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>
                Account data is stored in a secure PostgreSQL database (Neon)
              </li>
              <li>Screenshots are stored using Vercel Blob storage</li>
              <li>Passwords are hashed using bcrypt before storage</li>
              <li>All API communications use HTTPS encryption</li>
              <li>
                Authentication tokens are stored locally in your browser using
                Chrome's secure storage API
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">
              Third-Party Integrations
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              When you configure webhook integrations, your annotated
              screenshots are sent to the third-party services you specify (such
              as Linear, Asana, or Jira). These transmissions are made at your
              direction and are subject to the privacy policies of those
              third-party services.
            </p>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We do not sell, rent, or share your personal information with
              third parties for their marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">
              Chrome Extension Permissions
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Our Chrome extension requires certain permissions to function:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>
                <strong>activeTab:</strong> To capture screenshots of the
                current tab
              </li>
              <li>
                <strong>downloads:</strong> To save annotated screenshots to
                your computer
              </li>
              <li>
                <strong>scripting:</strong> To display the annotation overlay on
                web pages
              </li>
              <li>
                <strong>storage:</strong> To store authentication tokens and
                preferences locally
              </li>
              <li>
                <strong>tabs:</strong> To access page URLs and titles for
                context
              </li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We only access data necessary for the extension's functionality
              and do not track your browsing history or activity beyond the
              screenshots you explicitly capture.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Data Retention</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We retain your data for as long as your account is active. You can
              delete individual screenshots or your entire account at any time
              through the dashboard.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Your Rights</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and all associated data</li>
              <li>Export your data</li>
              <li>Opt out of our service at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Cookies and Tracking</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We use minimal cookies and local storage for authentication
              purposes only. We do not use tracking cookies or third-party
              analytics services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Children's Privacy</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Notto is not intended for users under the age of 13. We do not
              knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Changes to This Policy</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by updating the "Last updated" date at
              the top of this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-3xl mb-4">Contact Us</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
            </p>
            <p className="text-neutral-700 leading-relaxed">
              Email:{" "}
              <a
                href="mailto:privacy@notto.app"
                className="text-orange-600 hover:underline"
              >
                privacy@notto.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
