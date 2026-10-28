import Logo from "@/components/icons/Logo";
import { Card, CardContent } from "@/components/ui/card";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6">
      <Card className="w-full max-w-2xl border-none shadow-none ring-0">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-16">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <Logo className="h-26 w-26 object-contain sm:h-34 sm:w-34" />
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">
            Access Denied
          </h1>

          {/* Description */}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-paragraph sm:text-base">
            You don&apos;t have permission to view this page. If you believe
            this is a mistake, please contact your administrator.
          </p>

          {/* Actions */}
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <PrimaryButton href="/admin/profile" lifColor="light">
              Back to Profile
            </PrimaryButton>
            <PrimaryButton btnType="outline" href="/contact-us">
              Contact Support
            </PrimaryButton>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
