import chalk from "chalk";

/**
 * Utility class to printing like console but has been formatted
 */
class Terminal {
  /**
   * Printing log
   * @param args anything
   */
  static log(...args: any[]): void {
    console.log(chalk.whiteBright.bold("[BOT]"), ...args);
  }

  /**
   * Printing info
   * @param args anything
   */

  static info(...args: any[]): void {
    console.log(chalk.greenBright.bold("[BOT]"), ...args);
  }

  /**
   * Printing error
   * @param args anything
   */

  static error(...args: any[]): void {
    console.log(chalk.redBright.bold("[BOT]"), ...args);
  }
}

export { Terminal };
