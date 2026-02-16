import makeWASocket, {
  Browsers,
  proto,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Connection } from "./src/utils/Connection";
import { Commands } from "./src/utils/Commands";
import pino from "pino";
import { LocalData } from "./src/utils/LocalData";
import { Terminal } from "./src/utils/Terminal";

let isHearing = false;

/**
 * Main function
 */
async function main() {
  Terminal.log("Started app");

  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.windows("mkx"),
  });

  sock.ev.on("connection.update", async (event) => {
    Connection.startEvent(event, main);
  });

  sock.ev.on("creds.update", saveCreds);

  await Commands.loadCommands();
  await LocalData.loadSettings();

  sock.ev.on("messages.upsert", async ({ messages, type, requestId }) => {
    messages.forEach(async (message) => {
      const { message: chat, key } = message;

      const content = chat?.extendedTextMessage ?? chat?.imageMessage,
        fromMe = key.fromMe ?? true;

      if (fromMe) return;
      if (!content || !key.remoteJid) return;

      const text =
        content instanceof proto.Message.ImageMessage
          ? content.caption
          : content instanceof proto.Message.ExtendedTextMessage
            ? content.text
            : undefined;
      if (!text) return;

      const splited = text.split(" ");
      const prefix = LocalData._data.bot.prefix;

      if (isHearing) {
        const [cmd, ...args] = splited;
        isHearing = false;

        if (!cmd) return;

        await Commands.handle(cmd, { args, content, sock, key, message });
        return;
      }

      const [cmd, ...args] = splited.slice(
        splited.findIndex((e) => e.toLowerCase() === prefix) + 1,
      );

      if (!cmd) {
        sock.sendMessage(key.remoteJid, { text: "What?" }, { quoted: message });
        sock.readMessages([key]);
        isHearing = true;

        return;
      }

      await Commands.handle(cmd, { args, content, sock, key, message });
    });
  });
}

main();

process.on("beforeExit", (code) => {
  Terminal.log("Saving settings, with exit code:", code);
  LocalData.saveSettings();
});
