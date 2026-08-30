export const countries = [
  { code: "AU", value: "Australia" },
  { code: "CA", value: "Canada" },
  { code: "DE", value: "Germany" },
  { code: "FR", value: "France" },
  { code: "ID", value: "Indonesia" },
  { code: "JP", value: "Japan" },
  { code: "NL", value: "Netherlands" },
  { code: "SG", value: "Singapore" },
  { code: "GB", value: "United Kingdom" },
  { code: "US", value: "United States" },
] as const;

export const pathways = [
  "job",
  "ausbildung",
  "apprenticeship",
  "internship",
  "vocational",
] as const;

export const workModes = ["onsite", "hybrid", "remote"] as const;
