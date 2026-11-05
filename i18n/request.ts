import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import englishMessages from "../messages/en.json";

function getEnglishFallback(namespace: string | undefined, key: string) {
  const path = [...(namespace?.split(".") ?? []), ...key.split(".")];
  let message: unknown = englishMessages;

  for (const segment of path) {
    if (
      typeof message !== "object" ||
      message === null ||
      !Object.hasOwn(message, segment)
    ) {
      return namespace ? `${namespace}.${key}` : key;
    }

    message = (message as Record<string, unknown>)[segment];
  }

  return typeof message === "string"
    ? message
    : namespace
      ? `${namespace}.${key}`
      : key;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Asia/Kolkata",
    onError(error) {
      if (error.code === "MISSING_MESSAGE") {
        console.warn(error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      return getEnglishFallback(namespace, key);
    },
  };
});
