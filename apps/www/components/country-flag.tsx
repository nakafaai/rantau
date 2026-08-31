import { cn } from "@heroui/react";
import auFlag from "country-flag-icons/string/3x2/AU";
import caFlag from "country-flag-icons/string/3x2/CA";
import deFlag from "country-flag-icons/string/3x2/DE";
import frFlag from "country-flag-icons/string/3x2/FR";
import gbFlag from "country-flag-icons/string/3x2/GB";
import idFlag from "country-flag-icons/string/3x2/ID";
import jpFlag from "country-flag-icons/string/3x2/JP";
import nlFlag from "country-flag-icons/string/3x2/NL";
import sgFlag from "country-flag-icons/string/3x2/SG";
import usFlag from "country-flag-icons/string/3x2/US";
import type { ReactNode } from "react";

type ParsedFlag = Readonly<{ body: string; viewBox: string }>;

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/u;

/** Extracts the package-owned SVG body and view box for inline rendering. */
function parseFlagSource(source: string): ParsedFlag | undefined {
  const bodyStart = source.indexOf(">");
  const bodyEnd = source.lastIndexOf("</svg>");
  const viewBoxStart = source.indexOf('viewBox="');
  const viewBoxEnd = source.indexOf('"', viewBoxStart + 9);

  if (
    bodyStart === -1 ||
    bodyEnd === -1 ||
    viewBoxStart === -1 ||
    viewBoxEnd === -1
  ) {
    return;
  }

  return {
    body: source.slice(bodyStart + 1, bodyEnd),
    viewBox: source.slice(viewBoxStart + 9, viewBoxEnd),
  };
}

const flagSources = new Map<string, ParsedFlag | undefined>([
  ["AU", parseFlagSource(auFlag)],
  ["CA", parseFlagSource(caFlag)],
  ["DE", parseFlagSource(deFlag)],
  ["FR", parseFlagSource(frFlag)],
  ["GB", parseFlagSource(gbFlag)],
  ["ID", parseFlagSource(idFlag)],
  ["JP", parseFlagSource(jpFlag)],
  ["NL", parseFlagSource(nlFlag)],
  ["SG", parseFlagSource(sgFlag)],
  ["US", parseFlagSource(usFlag)],
]);

/** Selects one bundled flag without importing the all-country React barrel. */
function getFlagSource(countryCode: string | undefined) {
  const normalized = countryCode?.toUpperCase();
  if (!normalized) {
    return;
  }
  return flagSources.get(normalized);
}

/** Converts an ISO code into a Unicode flag when no bundled SVG is present. */
function countryEmoji(countryCode: string | undefined) {
  const normalized = countryCode?.toUpperCase();
  if (!normalized?.match(COUNTRY_CODE_PATTERN)) {
    return;
  }
  return String.fromCodePoint(
    ...[...normalized].map((letter) => 127_397 + letter.charCodeAt(0))
  );
}

/** Renders a compact country flag with a deterministic fallback. */
export function CountryFlag({
  className,
  countryCode,
  fallback = null,
}: {
  className?: string;
  countryCode?: string;
  fallback?: ReactNode;
}) {
  const flagSource = getFlagSource(countryCode);
  if (flagSource) {
    return (
      <svg
        aria-hidden
        className={cn("size-4 shrink-0", className)}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: The installed package owns these static SVG strings.
        dangerouslySetInnerHTML={{ __html: flagSource.body }}
        viewBox={flagSource.viewBox}
        xmlns="http://www.w3.org/2000/svg"
      />
    );
  }

  const emoji = countryEmoji(countryCode);
  if (!emoji) {
    return fallback;
  }
  return (
    <span
      aria-hidden
      className={cn("w-4 shrink-0 text-sm leading-none", className)}
    >
      {emoji}
    </span>
  );
}
