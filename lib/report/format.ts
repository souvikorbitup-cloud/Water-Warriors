const SMALL_NUMBERS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function underOneThousand(value: number): string {
  const words: string[] = [];
  let remainder = value;

  if (remainder >= 100) {
    words.push(`${SMALL_NUMBERS[Math.floor(remainder / 100)]} hundred`);
    remainder %= 100;
  }
  if (remainder >= 20) {
    const tens = TENS[Math.floor(remainder / 10)];
    const ones = SMALL_NUMBERS[remainder % 10];
    words.push(ones && remainder % 10 ? `${tens} ${ones}` : (tens ?? ""));
  } else if (remainder > 0 || words.length === 0) {
    words.push(SMALL_NUMBERS[remainder] ?? "");
  }

  return words.filter(Boolean).join(" ");
}

export function numberToIndianWords(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > 999_999_999) {
    return "";
  }

  if (value === 0) return "Zero";
  const groups: [number, string][] = [
    [10_000_000, "crore"],
    [100_000, "lakh"],
    [1_000, "thousand"],
  ];
  let remainder = value;
  const words: string[] = [];

  for (const [divisor, label] of groups) {
    const group = Math.floor(remainder / divisor);
    if (group > 0) {
      words.push(`${underOneThousand(group)} ${label}`);
      remainder %= divisor;
    }
  }
  if (remainder > 0) words.push(underOneThousand(remainder));

  const result = words.join(" ");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
