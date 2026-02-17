import { readFileSync } from "fs";
import { resolve } from "path";

export class Reader {
  /**
   * Read a file and parse key=value pairs.
   * Each line is treated as a key-value pair separated by the first '=' sign.
   * Empty lines and lines starting with '#' are ignored.
   *
   * @param filepath - Path to the file to read
   * @returns Object with parsed key-value pairs
   */
  static file(filepath: string): Record<string, string> {
    const absolutePath = resolve(resolve() + filepath);
    const content = readFileSync(absolutePath, "utf-8");
    const lines = content.split("\n");
    const result: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Split by first '=' sign
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex !== -1) {
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();

        // Parse escape sequences
        value = value
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\r/g, "\r")
          .replace(/\\\\/, "\\");

        if (key) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Get a specific value from the parsed file by key.
   *
   * @param filepath - Path to the file
   * @param key - The key to retrieve
   * @param defaultValue - Default value if key not found
   * @returns The value or default value
   */
  static getValue(
    filepath: string,
    key: string,
    defaultValue: string = "",
  ): string {
    const data = Reader.file(filepath);
    return data[key] ?? defaultValue;
  }
}
