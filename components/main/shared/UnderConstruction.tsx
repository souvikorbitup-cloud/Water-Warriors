import { Wrench } from "lucide-react";
import PrimaryButton from "./button/PrimaryButton";

type UnderConstructionProps = {
  pageName?: string;
  classes?: string;
};

export default function UnderConstruction({
  pageName = "This page",
  classes = "min-h-screen",
}: UnderConstructionProps) {
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
          Under Construction
        </h1>

        <p className="mt-4 text-lg text-paragraph">
          <b>{pageName}</b> is currently being built and will be available soon.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <PrimaryButton href="/" btnType="solid-primary">
            Back to Home
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}
