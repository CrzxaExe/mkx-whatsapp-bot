import type { proto, WAMessage } from "@whiskeysockets/baileys";
import type makeWASocket from "@whiskeysockets/baileys";

export const CommandCategories = {
  Group: "group",
  Helper: "helper",
  Utility: "utility",
} as const;

export type CommandCategory = ObjectValues<typeof CommandCategories>;

/**
 * Command identifier
 */
export type CommandConfig = {
  // mandatory options
  name: string;
  alias: string[];
  description: string;
  category: CommandCategory;
  args: string[];

  // optional options
  isAdmin?: boolean;
  isHidden?: boolean;
  prevWord?: string[];
  read?: boolean;
  withImage?: boolean;
};

export type CommandCallback = (args: CommandParams) => Promise<void>;

export type CommandData = {
  config: CommandConfig;

  callback: CommandCallback;
};

export type CommandParams = {
  content: proto.Message.IImageMessage | proto.Message.IExtendedTextMessage;
  sock: ReturnType<typeof makeWASocket>;
  args: string[];
  message: WAMessage;
  key: proto.IMessageKey;
};
