import type { CommandParams } from "../types/command.ts";
import { Commands } from "../utils/Commands.ts";
import { Language } from "../utils/Language.ts";

Commands.add(
  {
    name: "bot",
    alias: [],
    description: "command.bot",
    category: "configuration",
    args: ["sub", "query"],
    useCode: true,
  },
  async ({ sock, key, args }: CommandParams): Promise<void> => {
    const subCommand: { [key: string]: () => Promise<void> } = {
      prefix: async () => {
        console.log("test");
      },
    };

    const filtered = args.slice(
      args.findIndex((e) => Object.keys(subCommand).includes(e)) as number,
    );

    if (!filtered) {
      sock.sendMessage(key.remoteJid!, { text: Language.get("bot.general") });
      return;
    }

    sock.sendMessage(key.remoteJid!, {
      text: "filtered: " + filtered.join(", "),
    });
  },
);
