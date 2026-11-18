import { proto, makeWASocket, type WAMessage } from "@whiskeysockets/baileys";

export const CommandCategories = {
  Configuration: "configuration",
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
  useCode?: boolean;
  prevWord?: string[];
  read?: boolean;
  withImage?: boolean;
};

export type CommandCallback = (args: CommandParams) => Promise<void>;

export type CommandData = {
  config: CommandConfig;

  callback: CommandCallback;
};

/**
 * Parameter of the command
 */
export type CommandParams = {
  /**
   * Content message
   */
  content: proto.Message.IImageMessage | proto.Message.IExtendedTextMessage;
  /**
   * Unsplited content message text or caption
   */
  text: string;
  sock: ReturnType<typeof makeWASocket>;
  /**
   * Splited CommandParams.text, has been sliced after prefix
   */
  args: string[];
  message: WAMessage;
  key: proto.IMessageKey;
  /**
   * Owner code verification
   */
  code: string;
};
