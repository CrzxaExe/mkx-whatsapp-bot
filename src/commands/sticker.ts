import { downloadMediaMessage, proto } from "@whiskeysockets/baileys";
import type { CommandParams } from "../types/command.ts";
import { Commands } from "../utils/Commands.ts";
import { createSticker } from "../utils/sticker.ts";

Commands.add(
  {
    name: "sticker",
    alias: ["stiker", "sc"],
    description: "command.sticker",
    category: "utility",
    args: [],
    prevWord: ["create", "bikin", "gawe", "gawekna"],
    read: true,
    withImage: true,
  },
  async ({ sock, key, content, message }: CommandParams): Promise<void> => {
    if (!(content instanceof proto.Message.ImageMessage)) return;

    await sock.sendMessage(key.remoteJid!, {
      react: {
        text: "👍",
        key,
      },
    });
    await sock.sendPresenceUpdate("composing", key.remoteJid!);

    const buffer = await downloadMediaMessage(message, "buffer", {
      options: {},
    });

    const pack = "MKx from Zxra";
    const author = "Khyro";

    const stickerBuf = await createSticker(buffer as Buffer, pack, author);

    await sock.sendMessage(key.remoteJid!, {
      sticker: stickerBuf,
    });
    await sock.sendPresenceUpdate("available", key.remoteJid!);
  },
);
