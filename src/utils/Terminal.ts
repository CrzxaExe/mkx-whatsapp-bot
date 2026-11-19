import chalk from "chalk";

/**
 * Utility class to printing like console but has been formatted
 */
export const Terminal = {
  /**
   * Printing log
   * @param args anything
   */
  log(...args: any[]): void {
    console.log(chalk.whiteBright.bold("[BOT]"), ...args);
  },

  /**
   * Printing info
   * @param args anything
   */
  info(...args: any[]): void {
    console.log(chalk.greenBright.bold("[BOT]"), ...args);
  },

  /**
   * Printing error
   * @param args anything
   */
  error(...args: any[]): void {
    console.log(chalk.redBright.bold("[BOT]"), ...args);
  }
}
