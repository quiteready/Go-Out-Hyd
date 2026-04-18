import type { ReactElement } from "react";
import type { Metadata } from "next";
import LegalPageWrapper from "@/components/legal/LegalPageWrapper";
import { generateLegalMetadata } from "@/lib/metadata";
import TableOfContents from "@/components/legal/TableOfContents";
import LegalLayout from "@/components/legal/LegalLayout";

const lastUpdated = "2026-04-13";

export const metadata: Metadata = generateLegalMetadata(
  "Terms of Service",
  "Terms governing use of GoOut Hyd at goouthyd.com — cafe listings, event information, and platform rules.",
);

const tocSections = [
  { id: "acceptance", title: "Acceptance of Terms", level: 1 },
  { id: "platform-usage", title: "Platform Usage", level: 1 },
  { id: "cafe-listings", title: "Cafe Listings", level: 1 },
  { id: "event-information", title: "Event Information", level: 1 },
  { id: "intellectual-property", title: "Intellectual Property", level: 1 },
  { id: "limitation-of-liability", title: "Limitation of Liability", level: 1 },
  { id: "changes", title: "Changes to These Terms", level: 1 },
  { id: "contact", title: "Contact", level: 1 },
];

export default function TermsOfServicePage(): ReactElement {
  return (
    <LegalLayout tocSidebar={<TableOfContents sections={tocSections} />}>
      <LegalPageWrapper
        title="Terms of Service"
        lastUpdated={lastUpdated}
        contactEmail="hello@goouthyd.com"
        description="These Terms of Service govern your access to and use of GoOut Hyd at goouthyd.com, including browsing cafe listings and event information."
      >
        <section id="acceptance">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the website{" "}
            <a href="https://goouthyd.com">goouthyd.com</a> and related services
            (the &ldquo;Platform&rdquo;) operated by GoOut Hyd (&ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to these Terms of
            Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the
            Platform.
          </p>
          <p>
            We may update these Terms from time to time. The &ldquo;Last
            updated&rdquo; date above will change when we do. Your continued use
            of the Platform after changes constitutes acceptance of the revised
            Terms. Material changes may be highlighted on the Site where
            appropriate.
          </p>
        </section>

        <section id="platform-usage">
          <h2>2. Platform Usage</h2>
          <p>
            GoOut Hyd provides a discovery experience for independent cafes and
            events in Hyderabad. You agree to use the Platform only for lawful
            purposes and in a way that does not infringe the rights of others or
            restrict their use of the Platform.
          </p>
          <p>You must not:</p>
          <ul>
            <li>
              Scrape, crawl, or harvest data from the Platform without our prior
              written consent;
            </li>
            <li>
              Attempt to gain unauthorised access to our systems, accounts, or
              data;
            </li>
            <li>
              Use the Platform to transmit malware, spam, or misleading content;
            </li>
            <li>
              Misrepresent your identity or affiliation when contacting cafes or
              submitting forms.
            </li>
          </ul>
        </section>

        <section id="cafe-listings">
          <h2>3. Cafe Listings</h2>
          <p>
            Cafe profiles, photos, menus, and contact details are provided for
            information and discovery. Listings are curated and maintained by
            GoOut Hyd in collaboration with venue partners. We aim for accuracy
            but do not guarantee that every detail (hours, prices, availability)
            is current. Always confirm important information directly with the
            cafe before visiting.
          </p>
          <p>
            A listing on the Platform does not constitute our endorsement of any
            cafe beyond its inclusion in our directory. Partner submissions are
            subject to review and acceptance at our discretion.
          </p>
        </section>

        <section id="event-information">
          <h2>4. Event Information</h2>
          <p>
            Events shown on the Platform are for <strong>display and discovery
            only</strong>. GoOut Hyd does not sell tickets through the Site in
            Phase 1, and we are not the organiser of third-party events. Dates,
            times, prices, and entry rules may change; verify details with the
            venue or organiser before attending.
          </p>
          <p>
            Your attendance at any event is at your own risk and subject to the
            venue&apos;s policies and applicable law. We are not responsible for
            cancellations, line-ups, or on-site conditions.
          </p>
        </section>

        <section id="intellectual-property">
          <h2>5. Intellectual Property</h2>
          <p>
            The Platform, including its design, branding, text, and layout (other
            than third-party or cafe-provided content), is owned by GoOut Hyd or
            its licensors. You may not copy, modify, or distribute our materials
            without permission.
          </p>
          <p>
            Names, logos, and images belonging to cafes and venues remain the
            property of their respective owners and are displayed with
            permission or as part of our listing service.
          </p>
        </section>

        <section id="limitation-of-liability">
          <h2>6. Limitation of Liability</h2>
          <p>
            The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis. To the maximum extent permitted by applicable
            law in India, GoOut Hyd and its operators are not liable for any
            indirect, incidental, special, or consequential damages arising from
            your use of the Site, reliance on listings or event information, or
            interactions with third-party venues.
          </p>
          <p>
            Nothing in these Terms excludes or limits liability that cannot be
            excluded or limited under law. Nothing in these Terms affects your
            statutory rights as a consumer where applicable.
          </p>
        </section>

        <section id="changes">
          <h2>7. Changes to These Terms</h2>
          <p>
            We may revise these Terms to reflect changes to the Platform or legal
            requirements. We will update the &ldquo;Last updated&rdquo; date and,
            where appropriate, provide notice on the Site. If you continue to use
            the Platform after changes take effect, you accept the updated Terms.
          </p>
        </section>

        <section id="contact">
          <h2>8. Contact</h2>
          <p>
            For questions about these Terms or the Platform:
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
          <p>
            These Terms are governed by the laws of India. Disputes shall be
            subject to the exclusive jurisdiction of the courts at Hyderabad,
            Telangana, to the extent permitted by law.
          </p>
        </section>
      </LegalPageWrapper>
    </LegalLayout>
  );
}
