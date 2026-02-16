import { CommandCategories, type CommandParams } from "../types/command";
import { Commands } from "../utils/Commands";
import { LocalData } from "../utils/LocalData";

Commands.add(
  {
    name: "menu",
    alias: [],
    description: "Bot menu that contain all available command you can use",
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
        caption: LocalData._data.template.menu
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

                  text += `\n- ${r.config.name}`;
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
