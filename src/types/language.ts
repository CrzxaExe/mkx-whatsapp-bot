export const Languages = {
  // Add more language with matching name and file name, please be alphabeticaly
  en_US: "en_US",
} as const;

export type LanguageList = ObjectValues<typeof Languages>;
