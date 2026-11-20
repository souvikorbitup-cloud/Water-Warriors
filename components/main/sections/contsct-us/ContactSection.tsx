"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CircleHelp,
  FileChartColumn,
  Handshake,
  LifeBuoy,
  MapPin,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import SubmissionSuccessModal from "@/components/main/shared/modal/SubmissionSuccessModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { readApiError } from "@/lib/submissions/api-error";
import {
  CONTACT_REASONS,
  type ContactReason,
} from "@/lib/submissions/constants";
import {
  contactSubmissionSchema,
  firstZodErrorMessage,
  isContactReason,
  zodErrorToFieldErrors,
} from "@/lib/submissions/schemas";

const topics: { Icon: LucideIcon; index: 0 | 1 | 2 }[] = [
  { Icon: MapPin, index: 0 },
  { Icon: FileChartColumn, index: 1 },
  { Icon: MessageSquare, index: 2 },
];

const reasonIcons: Record<ContactReason, LucideIcon> = {
  question: CircleHelp,
  support: LifeBuoy,
  partnership: Handshake,
};

const reasons = CONTACT_REASONS.map((value) => ({
  Icon: reasonIcons[value],
  value,
}));

const fieldClasses =
  "rounded-lg border-input bg-background px-4 text-sm shadow-none placeholder:text-muted-foreground sm:text-[15px]";

export default function ContactSection() {
  const t = useTranslations("Contact");
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<ContactReason | "">("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    const parsed = contactSubmissionSchema.safeParse(raw);

    if (!parsed.success) {
      const errors = zodErrorToFieldErrors(parsed.error);
      setFieldErrors(errors);
      toast.error(firstZodErrorMessage(parsed.error));
      return;
    }

    setFieldErrors({});
    setSending(true);
    try {
      // TODO: point this at your own contact endpoint
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const { message, fieldErrors: apiFieldErrors } = await readApiError(
          response,
          t("error"),
        );
        if (apiFieldErrors) setFieldErrors(apiFieldErrors);
        if (response.status === 429) {
          toast.warning(message);
        } else {
          toast.error(message);
        }
        return;
      }

      toast.success(t("success"));
      form.reset();
      setReason("");
      setConfirmed(true);
    } catch {
      toast.error(t("error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <div className="grid items-start gap-8 lg:grid-cols-[0.65fr_1fr] lg:gap-12 xl:gap-16">
          {/* Left: intro + topics */}
          <div className="pt-8 sm:pt-0">
            <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              {t("helpTitle")}
            </h2>
            <p className="mt-4 text-base leading-normal sm:mt-5 lg:text-lg">
              {t("helpDescription")}
            </p>

            <div className="mt-8 rounded-2xl bg-secondary/35 p-5 sm:rounded-3xl sm:p-7 lg:mt-10">
              <h3 className="text-xl leading-snug font-semibold text-heading lg:text-[22px]">
                {t("directionTitle")}
              </h3>

              <ul className="mt-6 space-y-6 lg:space-y-7">
                {topics.map(({ Icon, index }) => (
                  <li key={index} className="grid grid-cols-[auto_1fr] gap-x-4">
                    <Icon className="mt-0.5 size-5 text-heading" aria-hidden />
                    <div>
                      <h4 className="text-lg leading-6 font-semibold text-heading sm:text-xl">
                        {t(`topics.${index}.title`)}
                      </h4>
                      <p className="mt-2 text-sm leading-6 sm:text-[15px]">
                        {t(`topics.${index}.description`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-7 lg:p-9"
          >
            <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
              {t("formTitle")}
            </h2>
            <p className="mt-2 text-sm sm:mt-3 sm:text-[15px]">
              {t("formDescription")}
            </p>

            <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
              <div>
                <Label
                  htmlFor="contact-reason"
                  className="text-sm font-medium text-heading sm:text-base"
                >
                  {t("reasonLabel")}
                </Label>
                <Select
                  name="reason"
                  required
                  value={reason}
                  onValueChange={(value) => {
                    if (isContactReason(value)) setReason(value);
                  }}
                >
                  <SelectTrigger
                    id="contact-reason"
                    aria-invalid={Boolean(fieldErrors.reason)}
                    className="mt-2 h-12! sm:h-13! w-full rounded-xl border-border px-4 text-[15px] shadow-none focus-visible:ring-primary/30"
                  >
                    <SelectValue placeholder={t("reasonPlaceholder")}>
                      {reason ? t(`reasons.${reason}.label`) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    align="start"
                    sideOffset={6}
                    className="w-(--radix-select-trigger-width) min-w-0 rounded-2xl p-1.5 shadow-xl"
                  >
                    {reasons.map(({ Icon, value }) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="rounded-xl py-2.5 pr-8 pl-2.5 focus:bg-primary/10 focus:text-foreground"
                      >
                        <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="size-5" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm leading-5 font-semibold text-heading">
                              {t(`reasons.${value}.label`)}
                            </span>
                            <span className="mt-0.5 block whitespace-normal text-xs leading-4 text-muted-foreground">
                              {t(`reasons.${value}.description`)}
                            </span>
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.reason && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.reason}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="contact-name"
                  className="text-sm font-medium text-heading sm:text-base"
                >
                  {t("name")}
                </Label>
                <Input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  placeholder={t("namePlaceholder")}
                  className={`mt-2 h-12 sm:h-13 ${fieldClasses}`}
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="contact-email"
                  className="text-sm font-medium text-heading sm:text-base"
                >
                  {t("email")}
                </Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  className={`mt-2 h-12 sm:h-13 ${fieldClasses}`}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="contact-message"
                  className="text-sm font-medium text-heading sm:text-base"
                >
                  {t("message")}
                </Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  aria-invalid={Boolean(fieldErrors.message)}
                  placeholder={t("messagePlaceholder")}
                  className={`mt-2 min-h-36 resize-y py-3.5 sm:min-h-41 ${fieldClasses}`}
                />
                {fieldErrors.message && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.message}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-5 text-xs leading-5.5 sm:mt-6 sm:text-[13px]">
              {t("hint")}
            </p>

            <div className="mt-6 sm:mt-7">
              <PrimaryButton
                btnType="solid-primary"
                type="submit"
                disabled={sending}
              >
                {sending ? t("sending") : t("send")}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>

      <SubmissionSuccessModal
        open={confirmed}
        onClose={() => setConfirmed(false)}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        closeLabel={t("confirmClose")}
      />
    </section>
  );
}
