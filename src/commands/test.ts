import type { CommandParams } from "../types/command";
import { Commands } from "../utils/Commands";

Commands.add(
  {
    name: "test",
    alias: [],
    description: "testing",
    category: "helper",
    args: [],
  },
  async ({ sock, key }: CommandParams): Promise<void> => {
    console.log("test");

    sock.sendMessage(key.remoteJid!, { text: "test" });
  },
);
