import { downloadMediaMessage, proto } from "@whiskeysockets/baileys";
import type { CommandParams } from "../types/command";
import { Commands } from "../utils/Commands";
import { createSticker } from "../utils/sticker";

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

    const buffer = await downloadMediaMessage(message, "buffer", {
      options: {},
    });

    const pack = "MKx from Zxra";
    const author = "Khyro";

    const stickerBuf = await createSticker(buffer as Buffer, pack, author);

    await sock.sendMessage(key.remoteJid!, {
      sticker: stickerBuf,
    });
  },
);
