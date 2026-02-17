import type { LanguageList } from "../types/language";
import { Reader } from "./Reader";
import { Terminal } from "./Terminal";

class Language {
  static _data: Record<string, string> = {};

  static load(language: LanguageList): void {
    Terminal.log("Loading language, now use", language);

    const data = Reader.file("/src/languages/" + language + ".lang");
    this._data = data;
  }

  static get(key: string, defaultValue: string = key): string {
    return this._data[key] ?? defaultValue;
  }
}

export { Language };
