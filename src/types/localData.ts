import type { LanguageList } from "./language.ts";

export type SettingData = {
  bot: {
    language: LanguageList;
    system_language: string;
    prefix: string;
    version: string;
  };
};
