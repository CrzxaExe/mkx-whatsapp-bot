import type { LanguageList } from "./language.ts";

export type SettingData = {
  bot: {
    language: LanguageList;
    prefix: string;
    version: string;
  };
};
