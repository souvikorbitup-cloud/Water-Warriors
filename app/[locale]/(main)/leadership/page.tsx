import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import TeamSectionSkeleton from "@/components/main/shared/section/TeamSectionSkeleton";
import { getPublicTeamByGroup } from "@/lib/content/team-member-service";
import TeamSection from "@/components/main/shared/section/TeamSection";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";
import CTASection from "@/components/main/shared/CTA/CTASection";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/leadership",
    titleKey: "leadershipTitle",
    descriptionKey: "leadershipDescription",
  });
}

export default async function Leadership({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Leadership");
  const tCommon = await getTranslations("Common");

  return (
    <>
      <MainbannerSection
        heading={
          <>
            {t("bannerHeading")}
            <br />
            <span className="text-primary">{t("bannerHighlight")}</span>
          </>
        }
        description={t("bannerDescription")}
        classes="max-w-80 sm:max-w-140"
        breadcrumbs={[
          {
            label: tCommon("home"),
            href: "/",
          },
          {
            label: tCommon("leadership"),
          },
        ]}
      />
      <Suspense
        fallback={
          <>
            <TeamSectionSkeleton className="mt-8 sm:mt-0" />
            <TeamSectionSkeleton />
          </>
        }
      >
        <LeadershipTeams
          locale={locale}
          leadershipTitle={t("leadershipTitle")}
          advisorsTitle={t("advisorsTitle")}
        />
      </Suspense>
      <CTASection />
    </>
  );
}

async function LeadershipTeams({
  locale,
  leadershipTitle,
  advisorsTitle,
}: {
  locale: string;
  leadershipTitle: string;
  advisorsTitle: string;
}) {
  await connection();
  const [leadership, technicalAdvisors] = await Promise.all([
    getPublicTeamByGroup("leadership", locale),
    getPublicTeamByGroup("technical_advisors", locale),
  ]);

  return (
    <>
      <TeamSection
        title={leadershipTitle}
        members={leadership.map((member) => ({
          id: member.id,
          full_name: member.fullName,
          avatar_url: member.avatarUrl,
          role: member.role,
          tagline: member.tagline,
          description: member.description,
        }))}
        className="mt-8 sm:mt-0"
      />
      <TeamSection
        title={advisorsTitle}
        members={technicalAdvisors.map((member) => ({
          id: member.id,
          full_name: member.fullName,
          avatar_url: member.avatarUrl,
          role: member.role,
          tagline: member.tagline,
          description: member.description,
        }))}
        className="bg-[linear-gradient(180deg,var(--secondary)_0%,rgba(255,255,255,0)_30%,#FFF_100%)]"
      />
    </>
  );
}
