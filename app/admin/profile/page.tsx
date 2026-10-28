import UserInfoCard from "@/components/admin/sections/user-profile/UserInfoCard";
import UserMetaCard from "@/components/admin/sections/user-profile/UserMetaCard";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { Metadata } from "next";
import { Suspense } from "react";
import Loding from "@/components/main/shared/loading/Loding";

export const metadata: Metadata = {
  title: "Profile",
  description: "",
};

export default function Profile() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loding />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
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
