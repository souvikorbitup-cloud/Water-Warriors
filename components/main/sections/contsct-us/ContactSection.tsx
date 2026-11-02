"use client";

import { FormEvent, useState } from "react";
import {
  FileChartColumn,
  MapPin,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Topic = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const topics: Topic[] = [
  {
    title: "Property assessment",
    description:
      "Questions about finding your location or selecting your rooftop area.",
    icon: MapPin,
  },
  {
    title: "Report questions",
    description:
      "Help understanding your customized rainwater-harvesting report.",
    icon: FileChartColumn,
  },
  {
    title: "General feedback",
    description:
      "Share your thoughts about Water Warriors AI and your experience.",
    icon: MessageSquare,
  },
];

const fieldClasses =
  "rounded-lg border-input bg-background px-4 text-sm shadow-none placeholder:text-muted-foreground sm:text-[15px]";

export default function ContactSection() {
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setSending(true);
    try {
      // TODO: point this at your own contact endpoint
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Request failed");

      toast.success("Thanks! Your message has been sent.");
      form.reset();
    } catch {
      toast.error("Could not send your message. Please try again.");
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
              How Can We Help?
            </h2>
            <p className="mt-4 text-base leading-normal sm:mt-5 lg:text-lg">
              Whether you're exploring rainwater harvesting for the first time
              or have a question about a report, use the form to share your
              inquiry.
            </p>

            <div className="mt-8 rounded-2xl bg-secondary/35 p-5 sm:rounded-3xl sm:p-7 lg:mt-10">
              <h3 className="text-xl leading-snug font-semibold text-heading lg:text-[22px]">
                Let's point you in the right direction.
              </h3>

              <ul className="mt-6 space-y-6 lg:space-y-7">
                {topics.map(({ title, description, icon: Icon }) => (
                  <li key={title} className="grid grid-cols-[auto_1fr] gap-x-4">
                    <Icon className="mt-0.5 size-5 text-heading" aria-hidden />
                    <div>
                      <h4 className="text-lg leading-6 font-semibold text-heading sm:text-xl">
                        {title}
                      </h4>
                      <p className="mt-2 text-sm leading-6 sm:text-[15px]">
                        {description}
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
            className="rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-7 lg:p-9"
          >
            <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
              Send us a message
            </h2>
            <p className="mt-2 text-sm sm:mt-3 sm:text-[15px]">
              Tell us a little about your question. Fields marked * are
              required.
            </p>

            <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
              <div>
                <Label
                  htmlFor="contact-name"
                  className="text-sm font-medium text-heading sm:text-base"
                >
                  Name *
                </Label>
                <Input
                  id="contact-name"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className={`mt-2 h-12 sm:h-13 ${fieldClasses}`}
                />
              </div>

              <div>
                <Label
                  htmlFor="contact-email"
                  className="text-sm font-medium text-heading sm:text-base"
                >
                  Email *
                </Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Your email address"
                  className={`mt-2 h-12 sm:h-13 ${fieldClasses}`}
                />
              </div>

              <div>
                <Label
                  htmlFor="contact-message"
                  className="text-sm font-medium text-heading sm:text-base"
                >
                  Message *
                </Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  required
                  placeholder="How can we help? Share the details of your question here."
                  className={`mt-2 min-h-36 resize-y py-3.5 sm:min-h-41 ${fieldClasses}`}
                />
              </div>
            </div>

            <p className="mt-5 text-xs leading-5.5 sm:mt-6 sm:text-[13px]">
              For a property question, mention the location and the step you're
              asking about. For a report question, tell us which part you'd like
              to understand.
            </p>

            <div className="mt-6 sm:mt-7">
              <PrimaryButton
                btnType="solid-primary"
                type="submit"
                disabled={sending}
              >
                {sending ? "Sending..." : "Send message"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
