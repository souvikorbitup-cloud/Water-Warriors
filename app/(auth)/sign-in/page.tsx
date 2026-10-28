"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OTPAuthForm } from "@/components/auth/OTPAuthForm";
import { ProfileCompletionForm } from "@/components/auth/ProfileCompletionForm";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const refetchedEmail = useRef<string | null>(null);
  const { user, isPending, refetch } = useCurrentUser();

  function handleVerified(email: string) {
    setVerifiedEmail(email);
  }

  useEffect(() => {
    if (!verifiedEmail || isPending) return;

    if (!user && refetchedEmail.current !== verifiedEmail) {
      refetchedEmail.current = verifiedEmail;
      void refetch();
      return;
    }

    if (!user) return;

    if (!user.isProfileComplete) return;

    const redirectTo = searchParams.get("redirect");
    if (redirectTo) {
      router.replace(redirectTo);
    } else {
      router.replace("/admin/profile");
    }
    router.refresh();
  }, [isPending, refetch, router, searchParams, user, verifiedEmail]);

  const shouldRedirect = verifiedEmail && !isPending && user?.isProfileComplete;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <Image
        src="/section-images/sign-in-banner.svg"
        alt="sign-in"
        fill
        className="h-full w-full object-cover object-center block"
      />
      {shouldRedirect ? null : verifiedEmail && !isPending && user ? (
        <ProfileCompletionForm
          email={verifiedEmail}
          redirectTo={searchParams.get("redirect")}
        />
      ) : (
        <OTPAuthForm
          subheading={
            <>
              To <b>Sign In</b> enter your email to receive a one-time code.
            </>
          }
          onVerified={handleVerified}
        />
      )}
    </main>
  );
}
