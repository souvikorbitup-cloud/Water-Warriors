import UserInfoCard from "@/components/admin/sections/user-profile/UserInfoCard";
import UserMetaCard from "@/components/admin/sections/user-profile/UserMetaCard";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Profile",
  description: "",
};

export default function Profile() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfilePageSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="space-y-6">
      <Skeleton className="h-6 w-36" />

      <div className="space-y-6" aria-hidden="true">
        <div className="rounded-2xl border border-border p-5 lg:p-6">
          <div className="flex flex-col items-center gap-4 md:gap-6 lg:flex-row">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>

        <div className="rounded-2xl border border-border p-5 lg:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="w-full space-y-6">
              <Skeleton className="h-6 w-44" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProfileContent() {
  const user = await requirePagePermission(PERMISSIONS.profileView);

  return (
    <>
      <h3 className="mb-5 text-lg font-semibold text-heading lg:mb-7 capitalize">
        {user.role} Profile
      </h3>
      <div className="space-y-6">
        <UserMetaCard
          firstName={user.firstName ?? ""}
          lastName={user.lastName ?? ""}
          profilePicUrl={
            user.profilePublicId
              ? getCloudinaryUrl(user.profilePublicId, "image")
              : null
          }
        />
        <UserInfoCard
          firstName={user.firstName ?? ""}
          lastName={user.lastName ?? ""}
          email={user.email}
          mobile={user.mobile ?? ""}
          profilePicUrl={
            user.profilePublicId
              ? getCloudinaryUrl(user.profilePublicId, "image")
              : null
          }
        />
      </div>
    </>
  );
}
