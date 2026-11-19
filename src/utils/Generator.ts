export const Generator = {
  id(length: number = 10): string {
    let result = "";
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

    for (let i = 0; i < length; i++)
      result += chars[Math.floor(Math.random() * chars.length)];

    return result;
  }
}
