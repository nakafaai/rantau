export const skillOptions = [
  { key: "customer-service", value: "Customer service" },
  { key: "healthcare", value: "Healthcare" },
  { key: "hospitality", value: "Hospitality" },
  { key: "logistics", value: "Logistics" },
  { key: "software", value: "Software" },
  { key: "welding", value: "Welding" },
] as const;

export const documentOptions = [
  { key: "passport", value: "Passport" },
  { key: "diploma", value: "Diploma" },
  { key: "driver-license", value: "Driver license" },
  { key: "language-certificate", value: "Language certificate" },
] as const;

export const languageOptions = [
  { countryCode: "GB", key: "english", value: "English" },
  { countryCode: "DE", key: "german", value: "German" },
  { countryCode: "ID", key: "indonesian", value: "Indonesian" },
  { countryCode: "JP", key: "japanese", value: "Japanese" },
  { countryCode: "FR", key: "french", value: "French" },
] as const;

export const levelOptions = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "Native",
] as const;
