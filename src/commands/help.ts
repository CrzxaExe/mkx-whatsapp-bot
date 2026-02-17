import type { CommandParams } from "../types/command";
import { Commands } from "../utils/Commands";
import { Formatter } from "../utils/Formatter";
import { Language } from "../utils/Language";
import { LocalData } from "../utils/LocalData";

Commands.add(
  {
    name: "help",
    alias: [],
    description: "command.help",
    category: "helper",
    args: ["commands"],
    read: true,
  },
  async ({ sock, key, args }: CommandParams): Promise<void> => {
    if (args.length > 0 && args[0]) {
      const command = Commands.get(args[0], args.slice(1));

      if (!command) {
        sock.sendMessage(key.remoteJid!, {
          text: "There is one command with that name, you can use 'mkx menu'",
        });
        return;
      }

      sock.sendMessage(key.remoteJid!, {
        text: Language.get("help.detail")
          .replace("%cmd", Formatter.capitalWord(command.config.name))
          .replace("%description", Language.get(command.config.description))
          .replace(
            "%alias",
            command.config.alias.length > 0
              ? command.config.alias.join(", ")
              : "None",
          )
          .replace(
            "%usage",
            `mkx ${command.config.name}` +
              command.config.args.map((e) => "<" + e + ">").join(" "),
          ),
      });
      return;
    }

    sock.sendMessage(key.remoteJid!, {
      text: Language.get("help.all")
        .replace(/%version/g, LocalData._data.bot.version)
        .replace(/%prefix/g, LocalData._data.bot.prefix)
        .replace(/%language/g, LocalData._data.bot.language),
    });
  },
);
