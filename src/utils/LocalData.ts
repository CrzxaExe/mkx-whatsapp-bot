import type { SettingData } from "../types/localData.ts";
import { Terminal } from "./Terminal.ts";
import { readFileSync } from "fs";

/**
 * Utility class to store bot data
 */
class LocalData {
  /**
   * Variable for storing bot data
   */
  static _data: SettingData = {
    bot: {
      language: "en_US",
      prefix: "mkx",
      version: "0.0.0",
    },
  };

  /**
   * Loading setting from settings.json
   */
  static loadSettings(): void {
    Terminal.log("Loading settings");

    const file = readFileSync("settings.json", { encoding: "utf8" });

    const json = JSON.parse(file) as SettingData;
    this._data = json;
  }

  /**
   * Saving settings.json
   */
  static async saveSettings(): Promise<void> {
    Terminal.log("Saving settings");
    await Bun.write("settings.json", JSON.stringify(this._data));
  }
}

export { LocalData };
