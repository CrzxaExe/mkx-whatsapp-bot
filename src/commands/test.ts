import type { CommandParams } from "../types/command.ts";
import { Commands } from "../utils/Commands.ts";
import { Language } from "../utils/Language.ts";

Commands.add(
  {
    name: "test",
    alias: [],
    description: "command.test",
    category: "helper",
    args: [],
  },
  async ({ sock, key }: CommandParams): Promise<void> => {
    const group = await sock.groupMetadata(key.remoteJid!);

    if (
      !group.participants.some(
        (e) =>
          e.id === key.participant &&
          (e.admin === "admin" || e.admin === "superadmin"),
      )
    ) {
      sock.sendMessage(key.remoteJid!, {
        text: Language.get("group.not.admin"),
      });
      return;
    }

    console.log("test");

    sock.sendMessage(key.remoteJid!, { text: "test" });
  },
);
