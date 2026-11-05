import { getTranslations } from "next-intl/server";
import { Wrench } from "lucide-react";
import PrimaryButton from "./button/PrimaryButton";

type UnderConstructionProps = {
  pageName?: string;
  classes?: string;
};

export default async function UnderConstruction({
  pageName,
  classes = "min-h-screen",
}: UnderConstructionProps) {
  const t = await getTranslations("Common");

  return (
    <main
      className={`flex ${classes} items-center justify-center bg-white px-6`}
    >
      <div className="mx-auto max-w-xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl border bg-muted p-5">
            <Wrench className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-primary">
          {t("underConstruction")}
        </h1>

        <p className="mt-4 text-lg text-paragraph">
          {t("underConstructionDescription", {
            pageName: pageName ?? t("thisPage"),
          })}
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <PrimaryButton href="/" localized btnType="solid-primary">
            {t("backToHome")}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}
