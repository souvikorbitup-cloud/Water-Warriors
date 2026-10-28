interface UserMetaCardProps {
  firstName: string;
  lastName: string;
  profilePicUrl: string | null;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
}

export default function UserMetaCard({
  firstName,
  lastName,
  profilePicUrl,
}: UserMetaCardProps) {
  const fullName = `${firstName} ${lastName}`.trim() || "User";

  return (
    <div className="p-5 border border-border rounded-2xl lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-4 md:gap-6 lg:flex-row">
          <div className="w-16 h-16 overflow-hidden flex items-center justify-center border border-border rounded-full bg-primary text-white text-xl font-semibold shrink-0">
            {profilePicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profilePicUrl}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(firstName, lastName)
            )}
          </div>
          <div className="order-3 xl:order-2">
            <h4 className="text-lg font-semibold text-center text-heading xl:text-left capitalize">
              {fullName}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
