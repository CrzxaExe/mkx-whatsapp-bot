import makeWASocket, { Browsers, proto } from "@whiskeysockets/baileys";
import { Connection } from "./src/utils/Connection.ts";
import { Commands } from "./src/utils/Commands.ts";
import pino from "pino";
import { LocalData } from "./src/utils/LocalData.ts";
import { Terminal } from "./src/utils/Terminal.ts";
import { Language } from "./src/utils/Language.ts";
import { Generator } from "./src/utils/Generator.ts";
import { useMultiFileAuthState } from "./src/utils/AuthState.ts";
import { Manager } from "./src/nlp/Manager.ts";

let isHearing = false;
let code: string = Generator.id();

/**
 * Main function
 */
async function main() {
  Terminal.log("Started app");

  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: ["Windows", "Edge", "20.0.04"],
  });

  sock.ev.on("connection.update", async (event) => {
    Connection.startEvent(event, main);
  });

  sock.ev.on("creds.update", saveCreds);

  await Commands.loadCommands(async () => {
    await Manager.setup();
  });
  LocalData.loadSettings();
  Language.load(LocalData._data.bot.language);
  Terminal.info("Owner execute code:", code);

  sock.ev.on("messages.upsert", async ({ messages, type, requestId }) => {
    messages.forEach(async (message) => {
      const { message: chat, key } = message;

      const prefix = LocalData._data.bot.prefix;
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
      if (!text || (!isHearing && !text.includes(prefix))) return;

      if (text === prefix) {
        isHearing = true;

        await sock.sendMessage(
          key.remoteJid,
          { text: Language.get("hearing.start", "?") },
          { quoted: message },
        );
        await sock.readMessages([key]);
        isHearing = true;

        return;
      }

      const result = await Manager.process(
        LocalData._data.bot.system_language,
        text,
      );
      const intent: string = result.intent as string;

      if ((result.score as number) < 0.6) return;
      const splited = intent.split(".");

      switch (splited[0]) {
        case "command":
          const [_intent, intentKey, ..._] = splited;
          const args = text.split(' ').filter(e => e === prefix)

          if (!intentKey) return;
          await Commands.handle(intentKey, {
            args,
            content,
            sock,
            key,
            message,
            code,
            text,
          })
          break;
      }
    });
  });
}

main();
