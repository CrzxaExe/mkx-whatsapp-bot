import { readdir } from "fs";
import type {
  CommandCallback,
  CommandConfig,
  CommandData,
  CommandParams,
} from "../types/command";
import { Terminal } from "./Terminal";

/**
 * Utility class to store
 */
class Commands {
  /**
   * Variable for stored commands
   */
  static data: CommandData[] = [];

  /**
   * Adding new command
   *
   * @param config config for command identifier
   * @param callback what command will do
   */
  static add(config: CommandConfig, callback: CommandCallback): void {
    this.data.push({ config, callback });
  }

  /**
   * Find command with matched name or it included on aliases
   * @param cmd command name
   * @returns CommandData or nothing
   */
  static get(cmd: string, args: string[]): CommandData | undefined {
    return this.data.find(
      (e) =>
        e.config.name === cmd ||
        e.config.alias.includes(cmd) ||
        (e.config.prevWord?.includes(cmd) &&
          (e.config.name === args[0] || e.config.alias.includes(args[0]!))),
    );
  }

  /**
   * Find command and run it
   * @param cmd command name
   * @param args whats callback needed
   * @returns nothing
   */
  static async handle(cmd: string, args: CommandParams): Promise<void> {
    const data = this.get(cmd, args.args);
    if (!data) return;
    if (data.config.read) args.sock.readMessages([args.key]);

    data.callback(args);
  }

  /**
   * Loading command from folders automaticly
   */
  static async loadCommands(): Promise<void> {
    Terminal.log("Loading commands");

    readdir("./src/commands", (err, files) => {
      if (err) throw new Error("Error on load commands");

      if (files.length < 1) {
        Terminal.info("No such file on commands");
        return;
      }

      files.forEach(async (file) => {
        if (!file.endsWith(".ts")) return;

        await import(`../commands/${file}`);
      });

      Terminal.info(`Load ${files.length} commands`);
    });
  }
}

export { Commands };
