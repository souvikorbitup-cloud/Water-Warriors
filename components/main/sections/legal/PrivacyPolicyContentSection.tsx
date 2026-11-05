import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Small building blocks
------------------------------------------------------------------- */

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-heading underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary"
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="font-semibold text-heading underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary"
    >
      {children}
    </Link>
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
              <dd key={`${name}-${index}`} className="text-paragraph">
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

export default async function PrivacyPolicyContentSection() {
  const t = await getTranslations("Privacy");

  const inShort = ([0, 1, 2, 3] as const).map((index) =>
    t(`inShort.${index}`),
  );
  const retention = ([0, 1, 2, 3, 4, 5] as const).map((index) =>
    t(`retention.${index}`),
  );
  const rights = ([0, 1, 2, 3] as const).map((index) => t(`rights.${index}`));
  const recipients = (
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
  ).map((index) => ({
    name: t(`recipients.${index}.name`),
    cells: [
      t(`recipients.${index}.for`),
      t(`recipients.${index}.receives`),
    ] as [string, string],
  }));
  const storage = ([0, 1, 2, 3, 4] as const).map((index) => ({
    name: t(`storage.${index}.name`),
    cells: [t(`storage.${index}.kept`), t(`storage.${index}.purpose`)] as [
      string,
      string,
    ],
  }));

  return (
    <section className="container-y-pad">
      <div className="my-container-x">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10 lg:space-y-12">
          {/* Intro */}
          <header className="pt-8 sm:pt-0">
            <p className="mt-3 text-sm sm:mt-4">{t("lastUpdated")}</p>
          </header>

          {/* In short */}
          <section className="rounded-2xl bg-secondary/35 p-5 sm:rounded-3xl sm:p-8">
            <SectionTitle>{t("inShortTitle")}</SectionTitle>
            <BulletList items={inShort} />
          </section>

          {/* What we handle */}
          <section>
            <SectionTitle>{t("handleTitle")}</SectionTitle>
            {([0, 1, 2, 3, 4, 5, 6] as const).map((index) => (
              <div key={index}>
                <SubTitle>{t(`handled.${index}.title`)}</SubTitle>
                <Paragraph>{t(`handled.${index}.body`)}</Paragraph>
              </div>
            ))}
            <div>
              <SubTitle>{t("handled.7.title")}</SubTitle>
              <Paragraph>{t("handled.7.body1")}</Paragraph>
              <Paragraph className="mt-3">
                {t.rich("handled.7.body2", {
                  cookieSettings: (chunks) => (
                    <strong className="font-semibold text-heading">
                      {chunks}
                    </strong>
                  ),
                  googlePrivacy: (chunks) => (
                    <TextLink href="https://policies.google.com/privacy">
                      {chunks}
                    </TextLink>
                  ),
                  optOut: (chunks) => (
                    <TextLink href="https://tools.google.com/dlpage/gaoptout">
                      {chunks}
                    </TextLink>
                  ),
                })}
              </Paragraph>
            </div>
            <div>
              <SubTitle>{t("handled.8.title")}</SubTitle>
              <Paragraph>
                {t.rich("handled.8.body", {
                  googleInfo: (chunks) => (
                    <TextLink href="https://policies.google.com/technologies/partner-sites">
                      {chunks}
                    </TextLink>
                  ),
                  adCenter: (chunks) => (
                    <TextLink href="https://myadcenter.google.com/">
                      {chunks}
                    </TextLink>
                  ),
                })}
              </Paragraph>
            </div>
            <div>
              <SubTitle>{t("handled.9.title")}</SubTitle>
              <Paragraph>{t("handled.9.body")}</Paragraph>
            </div>
          </section>

          {/* Who receives information */}
          <section>
            <SectionTitle>{t("recipientsTitle")}</SectionTitle>
            <Paragraph className="mb-4">{t("recipientsIntro")}</Paragraph>
            <DataTable
              columns={[
                t("columns.service"),
                t("columns.whatFor"),
                t("columns.whatReceives"),
              ]}
              rows={recipients}
            />
          </section>

          {/* Cookies and storage */}
          <section>
            <SectionTitle>{t("cookiesTitle")}</SectionTitle>
            <Paragraph className="mb-4">{t("cookiesIntro")}</Paragraph>
            <DataTable
              columns={[
                t("columns.item"),
                t("columns.keptFor"),
                t("columns.purpose"),
              ]}
              rows={storage}
              mono
            />
            <Paragraph className="mt-4">{t("cookiesOutro")}</Paragraph>
          </section>

          {/* Retention */}
          <section>
            <SectionTitle>{t("retentionTitle")}</SectionTitle>
            <BulletList items={retention} />
          </section>

          {/* Rights */}
          <section>
            <SectionTitle>{t("rightsTitle")}</SectionTitle>
            <BulletList items={rights} />
          </section>

          {/* Children */}
          <section>
            <SectionTitle>{t("childrenTitle")}</SectionTitle>
            <Paragraph>{t("children")}</Paragraph>
          </section>

          {/* Security */}
          <section>
            <SectionTitle>{t("securityTitle")}</SectionTitle>
            <Paragraph>{t("security")}</Paragraph>
          </section>

          {/* Changes */}
          <section>
            <SectionTitle>{t("changesTitle")}</SectionTitle>
            <Paragraph>{t("changes")}</Paragraph>
          </section>

          {/* Contact */}
          <section className="rounded-2xl bg-secondary/35 p-5 sm:rounded-3xl sm:p-8">
            <SectionTitle>{t("contactTitle")}</SectionTitle>
            <Paragraph>
              {t.rich("contact", {
                contactUs: (chunks) => (
                  <TextLink href="/contact-us">{chunks}</TextLink>
                ),
              })}
            </Paragraph>
          </section>
        </div>
      </div>
    </section>
  );
}
