"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
  feedbackSubmissionSchema,
  firstZodErrorMessage,
  zodErrorToFieldErrors,
} from "@/lib/submissions/schemas";

const topicKeys = ["property", "report", "general", "other"] as const;
const ratingValues = ["1", "2", "3", "4", "5"] as const;

const fieldClasses =
  "rounded-lg border-input bg-background px-4 text-sm shadow-none placeholder:text-muted-foreground sm:text-[15px]";

const labelClasses = "text-sm font-medium text-heading sm:text-base";

export default function FeedbackSection() {
  const t = useTranslations("Feedback");
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [topic, setTopic] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = event.currentTarget;
    const raw = { ...Object.fromEntries(new FormData(form)), topic };
    const parsed = feedbackSubmissionSchema.safeParse(raw);

    if (!parsed.success) {
      const errors = zodErrorToFieldErrors(parsed.error);
      setFieldErrors(errors);
      toast.error(firstZodErrorMessage(parsed.error));
      return;
    }

    setFieldErrors({});

    setSending(true);
    try {
      // TODO: point this at your own feedback endpoint
      const response = await fetch("/api/feedback", {
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
      setTopic("");
      setConfirmed(true);
    } catch {
      toast.error(t("error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="container-y-pad relative isolate overflow-hidden">
      {/* Decorative background shape */}
      <Image
        src="/section-images/w-logo-light.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none absolute -top-10 right-[-35%] -z-20 h-120 select-none"
      />

      <div className="my-container-x">
        <div className="grid items-start gap-8 lg:grid-cols-[0.65fr_1fr] lg:gap-12 xl:gap-16">
          {/* Left: intro */}
          <div className="pt-8 sm:pt-0">
            <h2 className="text-3xl leading-[1.15] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              {t("introTitle")}
            </h2>
            <p className="mt-4 text-base leading-normal sm:mt-5 lg:text-lg">
              {t("introDescription")}
            </p>
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
              {/* Topic */}
              <div>
                <Label htmlFor="feedback-topic" className={labelClasses}>
                  {t("topicLabel")}
                </Label>
                <Select value={topic} onValueChange={setTopic} name="topic">
                  <SelectTrigger
                    id="feedback-topic"
                    aria-invalid={Boolean(fieldErrors.topic)}
                    className={`mt-2 h-12! w-full sm:h-13! ${fieldClasses}`}
                  >
                    <SelectValue placeholder={t("topicPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="-translate-x-1.5">
                    {topicKeys.map((item) => (
                      <SelectItem
                        key={item}
                        value={item}
                        className="text-sm sm:text-[15px] w-full h-12!"
                      >
                        {t(`topics.${item}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.topic && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.topic}
                  </p>
                )}
              </div>

              {/* Rating */}
              <fieldset aria-describedby="rating-hint">
                <legend className={labelClasses}>{t("ratingLabel")}</legend>
                <div className="mt-2 grid grid-cols-5 gap-2 sm:gap-2.5">
                  {ratingValues.map((value) => (
                    <label key={value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        className="peer sr-only"
                      />
                      <span className="flex flex-col items-center justify-center gap-1 rounded-lg border border-input bg-background px-1 py-3 text-center transition-colors hover:border-primary peer-checked:border-primary peer-checked:bg-secondary peer-focus-visible:ring-2 peer-focus-visible:ring-ring sm:gap-2.5 sm:py-6">
                        <span className="font-heading text-2xl leading-none font-medium text-heading sm:text-[28px]">
                          {value}
                        </span>
                        <span className="text-[10px] leading-tight sm:text-sm">
                          {t(`ratings.${value}`)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p id="rating-hint" className="mt-3 text-xs sm:text-[13px]">
                  {t("ratingHint")}
                </p>
                {fieldErrors.rating && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.rating}
                  </p>
                )}
              </fieldset>

              {/* Name + email */}
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-5">
                <div>
                  <Label htmlFor="feedback-name" className={labelClasses}>
                    {t("name")}
                  </Label>
                  <Input
                    id="feedback-name"
                    name="name"
                    autoComplete="name"
                    placeholder={t("namePlaceholder")}
                    aria-invalid={Boolean(fieldErrors.name)}
                    className={`mt-2 h-12 sm:h-13 ${fieldClasses}`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="feedback-email" className={labelClasses}>
                    {t("email")}
                  </Label>
                  <Input
                    id="feedback-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("emailPlaceholder")}
                    aria-invalid={Boolean(fieldErrors.email)}
                    className={`mt-2 h-12 sm:h-13 ${fieldClasses}`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="feedback-message" className={labelClasses}>
                  {t("message")}
                </Label>
                <Textarea
                  id="feedback-message"
                  name="message"
                  aria-invalid={Boolean(fieldErrors.message)}
                  placeholder={t("messagePlaceholder")}
                  className={`mt-2 min-h-36 resize-y py-3.5 sm:min-h-43 ${fieldClasses}`}
                />
                <p className="mt-3 text-xs sm:text-[13px]">
                  {t("messageHint")}
                </p>
                {fieldErrors.message && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.message}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-6 text-xs sm:mt-8 sm:text-[13px]">
              {t("optionalHint")}
            </p>

            <div className="mt-6 sm:mt-7">
              <PrimaryButton
                btnType="solid-primary"
                type="submit"
                disabled={sending}
              >
                {sending ? t("submitting") : t("submit")}
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
