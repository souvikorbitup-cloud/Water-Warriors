import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Small building blocks
------------------------------------------------------------------- */

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="font-semibold text-heading underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary"
    >
      {children}
    </a>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-3 text-xl font-semibold text-heading sm:mb-4 sm:text-2xl">
      <span
        aria-hidden
        className="h-6 w-1.5 shrink-0 rounded-full bg-primary"
      />
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-6 mb-1.5 text-base font-semibold text-heading first:mt-0 sm:text-lg">
      {children}
    </h3>
  );
}

function Paragraph({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm leading-relaxed sm:text-base", className)}>
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-primary sm:text-base">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

type TableRow = { name: string; cells: [string, string]; mono?: boolean };

/** Responsive 3-column table: a real table on `sm+`, stacked labelled rows on mobile */
function DataTable({
  columns,
  rows,
  mono = false,
}: {
  columns: [string, string, string];
  rows: TableRow[];
  mono?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border text-sm">
      <div
        aria-hidden
        className="hidden grid-cols-[1fr_1.4fr_1.4fr] gap-4 bg-secondary px-4 py-3 font-semibold text-heading sm:grid"
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      <dl>
        {rows.map(({ name, cells }) => (
          <div
            key={name}
            className="grid gap-1 border-t border-border px-4 py-3 first:border-t-0 sm:grid-cols-[1fr_1.4fr_1.4fr] sm:gap-4"
          >
            <dt
              className={cn(
                "font-semibold text-heading",
                mono && "font-mono text-xs font-normal wrap-anywhere",
              )}
            >
              {name}
            </dt>
            {cells.map((cell, index) => (
              <dd key={cell} className="text-paragraph">
                <span className="font-medium text-heading sm:sr-only">
                  {columns[index + 1]}:{" "}
                </span>
                {cell}
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------
   Content
------------------------------------------------------------------- */

const inShort = [
  "You don't need an account to use the calculator.",
  "The area you draw stays in your browser. We send its location to the services that do the calculations, but we don't store it on our servers.",
  "We use Google Analytics cookies only if you accept them. Google may also set cookies for maps and, when ads are shown, for advertising.",
  "We don't sell your information.",
];

const handled: { title: string; body: ReactNode }[] = [
  {
    title: "The area you draw",
    body: (
      <Paragraph>
        When you draw a rooftop or open area on the map, its outline, size and
        location are kept in your browser for the current session. To produce
        your results, the location and size are sent to the services listed
        below for rainfall, groundwater and local impact analysis. We don't keep
        them on our servers, except that groundwater extraction results are
        cached for 24 hours under a scrambled code of the area's shape, so a
        repeat request is faster.
      </Paragraph>
    ),
  },
  {
    title: "Your name",
    body: (
      <Paragraph>
        If you type your name for the greeting, it stays in your browser for the
        current session and isn't sent to us.
      </Paragraph>
    ),
  },
  {
    title: "Saved rooftops",
    body: (
      <Paragraph>
        Rooftops you save on the Measure page are stored only on your device.
      </Paragraph>
    ),
  },
  {
    title: "Paid reports",
    body: (
      <Paragraph>
        Payments are handled by Razorpay. Your card, UPI or bank details go to
        Razorpay, not to us. We receive the order and payment IDs to confirm the
        payment. The infographic is created from your report figures by the
        image service selected for the site (getimg.ai or Google Gemini).
      </Paragraph>
    ),
  },
  {
    title: "PDF reports",
    body: (
      <Paragraph>
        Download PDF Report is created entirely in your browser. Print to PDF
        sends a copy of your report page to Browserless or to our own server at
        Amazon Web Services, which turns it into a PDF using a single-use link
        that expires shortly afterwards.
      </Paragraph>
    ),
  },
  {
    title: "Contact and feedback",
    body: (
      <Paragraph>
        When you send a message, what you enter (for example your name, email,
        phone number, organisation and message) is emailed to us through Resend.
        It isn't stored in our database. We keep the email as long as we need it
        to reply and follow up.
      </Paragraph>
    ),
  },
  {
    title: "Visitor counter",
    body: (
      <Paragraph>
        The footer shows how many people have visited and from which countries.
        To find your country, our server sends your IP address to ipwho.is or
        ipapi.co. We store only the country count, not your IP address, and your
        browser keeps a note so you're counted once.
      </Paragraph>
    ),
  },
  {
    title: "Site analytics",
    body: (
      <>
        <Paragraph>
          We use Google Analytics to understand how the site is used: which
          pages are visited, the device and browser, roughly where visitors are
          (country and city, worked out by Google from the IP address), how they
          arrived, and actions such as drawing an area (sent as a size band,
          never the exact area or its location), creating or downloading a
          report (with the city and state), starting or completing a payment
          (with the amount), and sending a contact or feedback form (never its
          contents). Admin pages are not measured.
        </Paragraph>
        <Paragraph className="mt-3">
          We ask before Google Analytics uses cookies. If you decline, or until
          you choose, it receives only cookieless signals that don't identify
          your browser. You can change your choice at any time with{" "}
          <strong className="font-semibold text-heading">
            Cookie settings
          </strong>{" "}
          at the bottom of any page. We have turned off Google signals and ad
          personalisation for analytics. See{" "}
          <TextLink href="https://policies.google.com/privacy">
            Google's Privacy Policy
          </TextLink>
          , or install the{" "}
          <TextLink href="https://tools.google.com/dlpage/gaoptout">
            Google Analytics opt-out add-on
          </TextLink>
          .
        </Paragraph>
      </>
    ),
  },
  {
    title: "Advertising",
    body: (
      <Paragraph>
        When ads are switched on for this site, they are provided by Google
        AdSense. Google and its partners use cookies to show ads based on your
        visits to this and other websites. You can read{" "}
        <TextLink href="https://policies.google.com/technologies/partner-sites">
          how Google uses information from sites that use its services
        </TextLink>{" "}
        and turn off personalised ads in{" "}
        <TextLink href="https://myadcenter.google.com/">My Ad Center</TextLink>.
        Ads never appear in your PDF reports.
      </Paragraph>
    ),
  },
  {
    title: "Server logs",
    body: (
      <Paragraph>
        Our hosting and back-end providers keep standard technical logs, such as
        IP address, browser type and time of request, to run the site securely.
      </Paragraph>
    ),
  },
];

const recipients: TableRow[] = [
  {
    name: "Google (Maps Platform)",
    cells: [
      "Map, place search, address lookup and the map image in your report",
      "Your IP address, the area you draw and its location",
    ],
  },
  {
    name: "Google (Gemini AI and Earth Engine)",
    cells: [
      "Groundwater and local impact analysis, and the paid infographic if Gemini is selected",
      "The location and size of the area, and the report figures",
    ],
  },
  {
    name: "Google (Analytics)",
    cells: [
      "Understanding how the site is used",
      "Pages viewed, the actions listed above, device and browser, approximate location from your IP address, and analytics cookies if you accept them",
    ],
  },
  {
    name: "Google (AdSense)",
    cells: [
      "Advertising, when ads are switched on for this site",
      "Cookies and similar identifiers, your IP address and the pages you view",
    ],
  },
  {
    name: "Open-Meteo",
    cells: [
      "Historical and seasonal rainfall",
      "Your IP address and the location's coordinates",
    ],
  },
  {
    name: "Supabase",
    cells: [
      "Our back end: runs the calculations above and stores site settings",
      "Your IP address and the data each calculation needs",
    ],
  },
  {
    name: "Razorpay",
    cells: [
      "Payment for the paid report",
      "The payment details you enter in Razorpay's checkout",
    ],
  },
  {
    name: "getimg.ai",
    cells: [
      "The paid infographic, if this model is selected",
      "The report figures (area, location name, rainfall, litres)",
    ],
  },
  {
    name: "Browserless or Amazon Web Services (AWS)",
    cells: [
      "Creating the Print to PDF version of your report",
      "A copy of your report page",
    ],
  },
  {
    name: "Resend",
    cells: [
      "Delivering Contact and Feedback messages to our inbox",
      "What you enter in the form",
    ],
  },
  {
    name: "ipwho.is and ipapi.co",
    cells: ["Finding your country for the visitor counter", "Your IP address"],
  },
  {
    name: "flagcdn.com",
    cells: ["Country flag images in the visitor counter", "Your IP address"],
  },
  {
    name: "Lovable and Amazon Web Services",
    cells: [
      "Hosting the website",
      "Standard server logs (IP address, browser, time)",
    ],
  },
];

const storage: TableRow[] = [
  {
    name: "site_authenticated",
    cells: ["Session", "Remembers that you signed in to the site"],
  },
  {
    name: "water_warrior_* (polygon points, location, name, map view, report access)",
    cells: [
      "Session",
      "Carries the area you drew, its location, the name you typed and your map view from page to page",
    ],
  },
  {
    name: "rooftop-projects",
    cells: ["Device", "Rooftops you save on the Measure page"],
  },
  {
    name: "ww_analytics_consent",
    cells: [
      "Device",
      "Remembers whether you accepted or declined analytics cookies",
    ],
  },
  {
    name: "water_warrior_country_counted",
    cells: [
      "Device",
      "Makes sure you are counted only once in the visitor counter",
    ],
  },
];

const retention = [
  "Session items in your browser: until you close the tab.",
  "Groundwater extraction cache: 24 hours.",
  "Print to PDF links: single use, expiring within minutes.",
  "Contact and feedback emails: as long as needed to reply and follow up.",
  "Visitor counts: country totals only, kept indefinitely.",
  "Google Analytics data: 14 months, then deleted by Google.",
];

const rights = [
  "You can clear the site's browser storage at any time in your browser settings.",
  "You can accept or decline analytics cookies with Cookie settings at the bottom of any page.",
  "You can block or delete cookies in your browser, and turn off personalised ads in My Ad Center.",
  "Under India's Digital Personal Data Protection Act, 2023 and similar laws, you can ask us what personal data we hold about you, ask us to correct or delete it, and raise a grievance. We will respond within a reasonable time.",
];

/* ------------------------------------------------------------------
   Section
------------------------------------------------------------------- */

export default function PrivacyPolicyContentSection() {
  return (
    <section className="container-y-pad">
      <div className="my-container-x">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10 lg:space-y-12">
          {/* Intro */}
          <header className="pt-8 sm:pt-0">
            <p className="mt-3 text-sm sm:mt-4">
              Last updated: 27 October 2026
            </p>
          </header>

          {/* In short */}
          <section className="rounded-2xl bg-secondary/35 p-5 sm:rounded-3xl sm:p-8">
            <SectionTitle>In short</SectionTitle>
            <BulletList items={inShort} />
          </section>

          {/* What we handle */}
          <section>
            <SectionTitle>What we handle and why</SectionTitle>
            {handled.map(({ title, body }) => (
              <div key={title}>
                <SubTitle>{title}</SubTitle>
                {body}
              </div>
            ))}
          </section>

          {/* Who receives information */}
          <section>
            <SectionTitle>Who receives information</SectionTitle>
            <Paragraph className="mb-4">
              These services process information on our behalf to provide the
              features above. Some of them process it outside India.
            </Paragraph>
            <DataTable
              columns={["Service", "What for", "What it receives"]}
              rows={recipients}
            />
          </section>

          {/* Cookies and storage */}
          <section>
            <SectionTitle>Cookies and browser storage</SectionTitle>
            <Paragraph className="mb-4">
              We don't set cookies ourselves. The site uses your browser's
              storage for the items below. “Session” items are deleted when you
              close the tab; “Device” items stay until you clear your browser
              data.
            </Paragraph>
            <DataTable
              columns={["Item", "Kept for", "Purpose"]}
              rows={storage}
              mono
            />
            <Paragraph className="mt-4">
              If you accept analytics cookies, Google Analytics sets the _ga
              cookie and one named after our property (_ga_ followed by an ID),
              which last up to 2 years. Google Maps and, when ads are shown,
              Google AdSense may set their own cookies, as described in Google's
              policies.
            </Paragraph>
          </section>

          {/* Retention */}
          <section>
            <SectionTitle>How long we keep information</SectionTitle>
            <BulletList items={retention} />
          </section>

          {/* Rights */}
          <section>
            <SectionTitle>Your choices and rights</SectionTitle>
            <BulletList items={rights} />
          </section>

          {/* Children */}
          <section>
            <SectionTitle>Children</SectionTitle>
            <Paragraph>
              This site is intended for adults. We don't knowingly collect
              personal data from children under 18. If you believe a child has
              sent us personal data, please contact us and we will delete it.
            </Paragraph>
          </section>

          {/* Security */}
          <section>
            <SectionTitle>Security</SectionTitle>
            <Paragraph>
              Information is sent over encrypted connections (HTTPS), and access
              to our back end is limited to the people who run the site. No
              method of transmission or storage is completely secure, but we
              take reasonable steps to protect your information.
            </Paragraph>
          </section>

          {/* Changes */}
          <section>
            <SectionTitle>Changes to this policy</SectionTitle>
            <Paragraph>
              We will update this page when our practices change and revise the
              date at the top.
            </Paragraph>
          </section>

          {/* Contact */}
          <section className="rounded-2xl bg-secondary/35 p-5 sm:rounded-3xl sm:p-8">
            <SectionTitle>Contact us</SectionTitle>
            <Paragraph>
              For questions, requests about your data or grievances, please
              write to us through the{" "}
              <TextLink href="/contact-us">Contact Us</TextLink> page and choose
              “Question”.
            </Paragraph>
          </section>
        </div>
      </div>
    </section>
  );
}
