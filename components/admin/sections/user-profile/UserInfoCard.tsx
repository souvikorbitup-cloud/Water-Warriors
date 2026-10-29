"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit } from "lucide-react";
import { useModal } from "@/lib/hooks/useModal";
import { isValidIndianPhone, isValidName } from "@/lib/auth/validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "../../shared/modal";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { RoleGate } from "@/components/auth/RoleGate";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useCurrentUser } from "@/lib/hooks/use-auth";

interface UserInfoCardProps {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  profilePicUrl: string | null;
}

export default function UserInfoCard({
  firstName: initialFirstName,
  lastName: initialLastName,
  email,
  mobile: initialMobile,
  profilePicUrl: initialProfilePicUrl,
}: UserInfoCardProps) {
  const router = useRouter();
  const { refetch } = useCurrentUser();
  const { isOpen, openModal, closeModal } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [mobile, setMobile] = useState(initialMobile);
  const [profilePicUrl, setProfilePicUrl] = useState(initialProfilePicUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fullName = `${firstName} ${lastName}`.trim() || "User";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setPendingFile(file);
    setProfilePicUrl(URL.createObjectURL(file));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidName(firstName) || !isValidName(lastName)) {
      toast.error("Please enter a valid first and last name.");
      return;
    }
    if (!isValidIndianPhone(mobile)) {
      toast.error("Please enter a valid Indian phone number.");
      return;
    }

    setIsSaving(true);
    try {
      let response: Response;
      if (pendingFile) {
        const form = new FormData();
        form.set("firstName", firstName);
        form.set("lastName", lastName);
        form.set("mobile", mobile);
        form.set("profilePic", pendingFile);
        response = await fetch("/api/profile", { method: "PATCH", body: form });
      } else {
        response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, mobile }),
        });
      }

      const body = await response.json();
      if (!response.ok) {
        toast.error(body?.message ?? "Could not update your profile.");
        return;
      }

      toast.success("Profile updated.");
      closeModal();
      await Promise.all([refetch(), router.refresh()]);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border p-5 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="mb-3 text-lg font-semibold text-heading lg:mb-6">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-paragraph">
                First Name
              </p>
              <p className="text-sm font-medium capitalize text-heading">
                {firstName || "-"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-paragraph">
                Last Name
              </p>
              <p className="text-sm font-medium capitalize text-heading">
                {lastName || "-"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-paragraph">
                Email address
              </p>
              <p className="text-sm font-medium text-heading">{email}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-paragraph">
                Mobile
              </p>
              <p className="text-sm font-medium text-heading">
                {mobile || "-"}
              </p>
            </div>
          </div>
        </div>

        <RoleGate permission={PERMISSIONS.profileEdit}>
          <PrimaryButton
            btnType="outline"
            className="border-border px-4!"
            onClick={openModal}
            startIcon={<Edit size={14} />}
          >
            Edit
          </PrimaryButton>
        </RoleGate>
      </div>

      <RoleGate permission={PERMISSIONS.profileEdit}>
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-175">
          <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 no-scrollbar lg:p-11">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-heading">
                Edit Info
              </h4>
              <p className="mb-6 text-sm text-paragraph lg:mb-7">
                Update your details to keep your profile up-to-date.
              </p>
            </div>

            <form onSubmit={handleSave} className="flex flex-col">
              <div className="custom-scrollbar overflow-y-auto px-2">
                <div className="mb-6 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-16 w-16 items-center justify-center cursor-pointer overflow-hidden rounded-full border border-border bg-primary text-xl font-semibold text-white"
                  >
                    {profilePicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profilePicUrl}
                        alt={fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-medium text-heading">
                      Profile picture
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-primary hover:underline cursor-pointer"
                    >
                      Change photo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-paragraph">
                      First Name
                    </Label>
                    <Input
                      defaultValue={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      disabled={isSaving}
                      className="h-11 rounded-lg border-border bg-transparent px-4 py-2.5 text-sm text-heading shadow-theme-xs focus-visible:border-muted-foreground focus-visible:ring-1 focus-visible:ring-muted-foreground/10"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-paragraph">
                      Last Name
                    </Label>
                    <Input
                      defaultValue={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      disabled={isSaving}
                      className="h-11 rounded-lg border-border bg-transparent px-4 py-2.5 text-sm text-heading shadow-theme-xs focus-visible:border-muted-foreground focus-visible:ring-1 focus-visible:ring-muted-foreground/10"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-paragraph">
                      Email address
                    </Label>
                    <Input
                      type="email"
                      defaultValue={email}
                      disabled
                      className="h-11 rounded-lg border-border bg-transparent px-4 py-2.5 text-sm text-heading shadow-theme-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-paragraph">
                      Mobile number
                    </Label>
                    <Input
                      type="tel"
                      defaultValue={mobile}
                      onChange={(event) => setMobile(event.target.value)}
                      disabled={isSaving}
                      className="h-11 rounded-lg border-border bg-transparent px-4 py-2.5 text-sm text-heading shadow-theme-xs focus-visible:border-muted-foreground focus-visible:ring-1 focus-visible:ring-muted-foreground/10"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
                <PrimaryButton
                  type="button"
                  btnType="outline"
                  className="border-border"
                  onClick={closeModal}
                >
                  Close
                </PrimaryButton>
                <PrimaryButton
                  type="submit"
                  btnType="solid-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </Modal>
      </RoleGate>
    </div>
  );
}
