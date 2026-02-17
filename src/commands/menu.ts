import { CommandCategories, type CommandParams } from "../types/command";
import { Commands } from "../utils/Commands";
import { Language } from "../utils/Language";
import { LocalData } from "../utils/LocalData";

Commands.add(
  {
    name: "menu",
    alias: [],
    description: "command.menu",
    category: "helper",
    args: [],
    read: true,
  },
  async ({ sock, key, message }: CommandParams): Promise<void> => {
    sock.sendMessage(
      key.remoteJid!,
      {
        image: {
          url: Bun.pathToFileURL("./src/assets/menu_alt.jpg"),
        },
        caption: Language.get("menu")
          .replace(
            "%menu",
            Object.keys(CommandCategories)
              .map((e) => {
                let text = "*[" + e + "]*";

                Commands.data.forEach((r) => {
                  if (
                    (r.config.category as string).toLowerCase() !==
                    e.toLowerCase()
                  )
                    return;

                  text += `\n- ${r.config.name}${r.config.isAdmin ? " <Admin>" : ""}`;
                });

                return text;
              })
              .join("\n\n"),
          )
          .replace("%version", LocalData._data.bot.version),
      },
      { quoted: message },
    );
  },
);
