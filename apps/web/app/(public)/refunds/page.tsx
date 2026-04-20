import type { ReactElement } from "react";
import type { Metadata } from "next";
import LegalPageWrapper from "@/components/legal/LegalPageWrapper";
import { generateLegalMetadata } from "@/lib/metadata";
import TableOfContents from "@/components/legal/TableOfContents";
import LegalLayout from "@/components/legal/LegalLayout";

const lastUpdated = "2026-04-20";

export const metadata: Metadata = generateLegalMetadata(
  "Refund & Cancellation Policy",
  "How refunds and cancellations work for event tickets purchased on GoOut Hyd.",
);

const tocSections = [
  { id: "customer-cancellations", title: "Customer cancellations", level: 1 },
  { id: "organiser-cancellation", title: "Event cancellation by organiser", level: 1 },
  { id: "rescheduling", title: "Event rescheduling", level: 1 },
  { id: "contact", title: "Contact", level: 1 },
];

export default function RefundsPolicyPage(): ReactElement {
  return (
    <LegalLayout tocSidebar={<TableOfContents sections={tocSections} />}>
      <LegalPageWrapper
        title="Refund & Cancellation Policy"
        lastUpdated={lastUpdated}
        contactEmail="hello@goouthyd.com"
        description="This policy explains refunds and cancellations for tickets bought on GoOut Hyd. It applies in addition to our Terms of Service."
      >
        <section id="customer-cancellations">
          <h2>1. Customer cancellations</h2>
          <p>
            Tickets are <strong>non-refundable</strong> once purchased. If you
            cannot attend, you may <strong>transfer your ticket</strong> to
            another person by contacting us at{" "}
            <a href="mailto:hello@goouthyd.com">hello@goouthyd.com</a> at
            least <strong>24 hours before</strong> the event start time. We will
            confirm what information we need to process a transfer.
          </p>
        </section>

        <section id="organiser-cancellation">
          <h2>2. Event cancellation by organiser</h2>
          <p>
            If an event is <strong>cancelled</strong> by the organiser (or the
            event does not go ahead as listed), you will receive a{" "}
            <strong>full refund</strong>, including any convenience fee charged
            at checkout, to your <strong>original payment method</strong>. We
            aim to process refunds within <strong>7 business days</strong> from
            confirmed cancellation; bank or UPI timelines may add a short delay.
          </p>
        </section>

        <section id="rescheduling">
          <h2>3. Event rescheduling</h2>
          <p>
            If an event is <strong>rescheduled</strong>, your ticket remains
            valid for the new date unless we tell you otherwise. If you{" "}
            <strong>cannot attend</strong> the new date, contact us at{" "}
            <a href="mailto:hello@goouthyd.com">hello@goouthyd.com</a> within{" "}
            <strong>48 hours</strong> of the rescheduling announcement (or as
            stated in our email to you) to request a full refund.
          </p>
        </section>

        <section id="contact">
          <h2>4. Contact</h2>
          <p>
            For all ticketing support, email{" "}
            <a href="mailto:hello@goouthyd.com">hello@goouthyd.com</a>. We aim
            to respond within <strong>24 hours</strong> on business days.
          </p>
        </section>
      </LegalPageWrapper>
    </LegalLayout>
  );
}
