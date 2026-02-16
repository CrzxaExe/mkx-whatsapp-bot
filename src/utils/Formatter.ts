/**
 * Utility class to formating object
 */
class Formatter {
  /**
   * Caplitalize first letter of text
   * @param text text want to format
   * @returns formated text
   */
  static capitalWord(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

export { Formatter };
