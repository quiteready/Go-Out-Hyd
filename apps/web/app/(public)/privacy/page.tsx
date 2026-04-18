import type { ReactElement } from "react";
import type { Metadata } from "next";
import LegalPageWrapper from "@/components/legal/LegalPageWrapper";
import { generateLegalMetadata } from "@/lib/metadata";
import TableOfContents from "@/components/legal/TableOfContents";
import LegalLayout from "@/components/legal/LegalLayout";

const lastUpdated = "2026-04-13";

export const metadata: Metadata = generateLegalMetadata(
  "Privacy Policy",
  "How GoOut Hyd collects, uses, and protects information when you use goouthyd.com and submit the cafe partner interest form.",
);

const tocSections = [
  { id: "introduction", title: "Introduction", level: 1 },
  { id: "information-we-collect", title: "Information We Collect", level: 1 },
  { id: "how-we-use", title: "How We Use Your Information", level: 1 },
  { id: "cookies", title: "Cookies & Analytics", level: 1 },
  { id: "retention", title: "Data Retention", level: 1 },
  { id: "security", title: "Data Security", level: 1 },
  { id: "rights", title: "Your Rights", level: 1 },
  { id: "changes", title: "Changes to This Policy", level: 1 },
  { id: "contact", title: "Contact Information", level: 1 },
];

export default function PrivacyPolicyPage(): ReactElement {
  return (
    <LegalLayout tocSidebar={<TableOfContents sections={tocSections} />}>
      <LegalPageWrapper
        title="Privacy Policy"
        lastUpdated={lastUpdated}
        contactEmail="hello@goouthyd.com"
        description="This Privacy Policy describes how GoOut Hyd (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) handles information when you visit goouthyd.com and when cafe owners submit interest through our partner form."
      >
        <section id="introduction">
          <h2>1. Introduction</h2>
          <p>
            GoOut Hyd operates the website{" "}
            <a href="https://goouthyd.com">goouthyd.com</a> (the &ldquo;Site&rdquo;)
            to help people discover independent cafes and events in Hyderabad,
            India. We respect your privacy and want you to understand what we
            collect and why.
          </p>
          <p>
            By using the Site or submitting information to us, you agree to this
            Privacy Policy. If you do not agree, please do not use the Site or
            submit forms.
          </p>
        </section>

        <section id="information-we-collect">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information you provide</h3>
          <p>
            <strong>Partner interest form.</strong> If you use the &ldquo;List
            Your Cafe&rdquo; or partner interest flow, we collect the details you
            enter: your name (or contact name), cafe or business name, phone
            number, and the Hyderabad area you select (or &ldquo;Other&rdquo;).
            We may also store optional notes you provide or that we add for
            follow-up.
          </p>
          <p>
            <strong>Communications.</strong> If you email or message us, we keep
            the content of those messages and associated contact details so we
            can respond.
          </p>
          <h3>2.2 Information collected automatically</h3>
          <p>
            When you browse the Site, our hosting and analytics tools may
            process technical data such as IP address, browser type, device
            type, general location (e.g. region), pages viewed, and timestamps.
            We use this to run, secure, and improve the Site.
          </p>
        </section>

        <section id="how-we-use">
          <h2>3. How We Use Your Information</h2>
          <p>We use personal information to:</p>
          <ul>
            <li>
              Respond to partner and cafe-owner enquiries and manage lead
              follow-up;
            </li>
            <li>
              Operate and improve cafe and event listings shown on the platform;
            </li>
            <li>
              Send operational emails (for example, acknowledging a partner
              submission or following up on a listing);
            </li>
            <li>
              Monitor performance, fix errors, and protect the Site against abuse
              or security issues;
            </li>
            <li>Comply with applicable law and enforce our terms.</li>
          </ul>
          <p>
            We do not sell your personal information. We do not use partner lead
            data to train third-party AI models.
          </p>
        </section>

        <section id="cookies">
          <h2>4. Cookies &amp; Analytics</h2>
          <p>
            We use cookies and similar technologies that are necessary for the
            Site to function (for example, session and security cookies). We also
            use <strong>Vercel Analytics</strong> to understand aggregate traffic
            and page views (such as which pages are popular). Analytics is
            configured to support privacy-friendly, aggregated measurement where
            possible.
          </p>
          <p>
            You can control cookies through your browser settings. Blocking some
            cookies may limit certain features of the Site.
          </p>
        </section>

        <section id="retention">
          <h2>5. Data Retention</h2>
          <p>
            We keep partner lead and contact information for as long as needed to
            follow up on your enquiry, manage listings, and meet legal or
            operational requirements. Technical logs and analytics may be retained
            for shorter periods according to our hosting and analytics providers.
            When data is no longer needed, we delete or anonymise it where
            practicable.
          </p>
        </section>

        <section id="security">
          <h2>6. Data Security</h2>
          <p>
            We use industry-standard measures appropriate to the nature of our
            service, including encryption in transit (HTTPS), access controls on
            our database (hosted with Supabase), and limited access to personal
            data on a need-to-know basis. No method of transmission over the
            internet is completely secure; we cannot guarantee absolute security.
          </p>
        </section>

        <section id="rights">
          <h2>7. Your Rights</h2>
          <p>
            Depending on applicable law, you may have the right to request access
            to, correction of, or deletion of your personal information, or to
            object to or restrict certain processing. To exercise these rights,
            contact us using the details below. We will respond within a
            reasonable time.
          </p>
        </section>

        <section id="changes">
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &ldquo;Last
            updated&rdquo; date at the top of this page will change when we do.
            Continued use of the Site after changes means you accept the updated
            policy. For material changes, we will take reasonable steps to notify
            you (for example, a notice on the Site).
          </p>
        </section>

        <section id="contact">
          <h2>9. Contact Information</h2>
          <p>
            GoOut Hyd is operated in Hyderabad, Telangana, India. For privacy
            questions or requests:
          </p>
          <ul>
            <li>
              Email:{" "}
              <a href="mailto:hello@goouthyd.com">hello@goouthyd.com</a>
            </li>
            <li>
              Website:{" "}
              <a href="https://goouthyd.com">https://goouthyd.com</a>
            </li>
          </ul>
        </section>
      </LegalPageWrapper>
    </LegalLayout>
  );
}
