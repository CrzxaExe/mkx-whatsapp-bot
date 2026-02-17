import type { LanguageList } from "./language";

export type SettingData = {
  bot: {
    language: LanguageList;
    prefix: string;
    version: string;
  };
};
