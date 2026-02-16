import { Terminal } from "./Terminal";

/**
 * Utility class to store bot data
 */
class LocalData {
  /**
   * Variable for storing bot data
   */
  static _data: SettingData = {
    bot: {
      version: "0.0.0",
      prefix: "mkx",
    },
    template: {
      helpAll: "",
      helpDetail: "",
      menu: "",
    },
  };

  /**
   * Loading setting from settings.json
   */
  static async loadSettings(): Promise<void> {
    Terminal.log("Loading settings");

    const file = Bun.file("settings.json");

    const json = (await file.json()) as SettingData;
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
