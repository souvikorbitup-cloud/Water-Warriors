"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
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

const topics = [
  "Property assessment",
  "Report questions",
  "General feedback",
  "Something else",
];

const ratings = [
  { value: "1", label: "Poor" },
  { value: "2", label: "Fair" },
  { value: "3", label: "Good" },
  { value: "4", label: "Very good" },
  { value: "5", label: "Excellent" },
];

const fieldClasses =
  "rounded-lg border-input bg-background px-4 text-sm shadow-none placeholder:text-muted-foreground sm:text-[15px]";

const labelClasses = "text-sm font-medium text-heading sm:text-base";

export default function FeedbackSection() {
  const [sending, setSending] = useState(false);
  const [topic, setTopic] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!topic) {
      toast.error("Please select a feedback topic.");
      return;
    }

    const data = { ...Object.fromEntries(new FormData(form)), topic };

    setSending(true);
    try {
      // TODO: point this at your own feedback endpoint
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Request failed");

      toast.success("Thank you! Your feedback has been submitted.");
      form.reset();
      setTopic("");
    } catch {
      toast.error("Could not submit your feedback. Please try again.");
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
              A Better Journey <br className="hidden lg:block" />
              Starts With You.
            </h2>
            <p className="mt-4 text-base leading-normal sm:mt-5 lg:text-lg">
              Whether you're finding your property, marking a rooftop or
              exploring a report, we'd like to hear about your experience with
              Water Warriors AI.
            </p>
          </div>

          {/* Right: form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-7 lg:p-9"
          >
            <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
              Share your feedback
            </h2>
            <p className="mt-2 text-sm sm:mt-3 sm:text-[15px]">
              Fields marked * are required. Your name and email are optional.
            </p>

            <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
              {/* Topic */}
              <div>
                <Label htmlFor="feedback-topic" className={labelClasses}>
                  Feedback topic *
                </Label>
                <Select value={topic} onValueChange={setTopic} name="topic">
                  <SelectTrigger
                    id="feedback-topic"
                    className={`mt-2 h-12! w-full sm:h-13! ${fieldClasses}`}
                  >
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent className="-translate-x-1.5">
                    {topics.map((item) => (
                      <SelectItem
                        key={item}
                        value={item}
                        className="text-sm sm:text-[15px] w-full h-12!"
                      >
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <fieldset aria-describedby="rating-hint">
                <legend className={labelClasses}>
                  How was your overall experience? *
                </legend>
                <div className="mt-2 grid grid-cols-5 gap-2 sm:gap-2.5">
                  {ratings.map(({ value, label }) => (
                    <label key={value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        required
                        className="peer sr-only"
                      />
                      <span className="flex flex-col items-center justify-center gap-1 rounded-lg border border-input bg-background px-1 py-3 text-center transition-colors hover:border-primary peer-checked:border-primary peer-checked:bg-secondary peer-focus-visible:ring-2 peer-focus-visible:ring-ring sm:gap-2.5 sm:py-6">
                        <span className="font-heading text-2xl leading-none font-medium text-heading sm:text-[28px]">
                          {value}
                        </span>
                        <span className="text-[10px] leading-tight sm:text-sm">
                          {label}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p id="rating-hint" className="mt-3 text-xs sm:text-[13px]">
                  Choose one rating, from 1 (poor) to 5 (excellent).
                </p>
              </fieldset>

              {/* Name + email */}
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-5">
                <div>
                  <Label htmlFor="feedback-name" className={labelClasses}>
                    Name
                  </Label>
                  <Input
                    id="feedback-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Your name"
                    className={`mt-2 h-12 sm:h-13 ${fieldClasses}`}
                  />
                </div>
                <div>
                  <Label htmlFor="feedback-email" className={labelClasses}>
                    Email
                  </Label>
                  <Input
                    id="feedback-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`mt-2 h-12 sm:h-13 ${fieldClasses}`}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="feedback-message" className={labelClasses}>
                  Your feedback *
                </Label>
                <Textarea
                  id="feedback-message"
                  name="message"
                  required
                  placeholder="What worked well? What could we do better?"
                  className={`mt-2 min-h-36 resize-y py-3.5 sm:min-h-43 ${fieldClasses}`}
                />
                <p className="mt-3 text-xs sm:text-[13px]">
                  A little context helps us understand your feedback.
                </p>
              </div>
            </div>

            <p className="mt-6 text-xs sm:mt-8 sm:text-[13px]">
              If you'd like a response, include your email. You can leave both
              contact fields blank.
            </p>

            <div className="mt-6 sm:mt-7">
              <PrimaryButton
                btnType="solid-primary"
                type="submit"
                disabled={sending}
              >
                {sending ? "Submitting..." : "Submit feedback"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
