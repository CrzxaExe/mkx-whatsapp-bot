import makeWASocket, { Browsers, proto } from "@whiskeysockets/baileys";
import { Connection } from "./src/utils/Connection.ts";
import { Commands } from "./src/utils/Commands.ts";
import pino from "pino";
import { LocalData } from "./src/utils/LocalData.ts";
import { Terminal } from "./src/utils/Terminal.ts";
import { Language } from "./src/utils/Language.ts";
import { Generator } from "./src/utils/Generator.ts";
import { useMultiFileAuthState } from "./src/utils/AuthState.ts";

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
    logger: pino({ level: "debug" }),
    browser: ["Windows", "Edge", "20.0.04"],
  });

  // const ver = await sock.requestPairingCode("6289539851501");
  // console.log(ver);

  sock.ev.on("connection.update", async (event) => {
    Connection.startEvent(event, main);
  });

  sock.ev.on("creds.update", saveCreds);

  await Commands.loadCommands();
  LocalData.loadSettings();
  Language.load(LocalData._data.bot.language);
  Terminal.info("Owner execute code:", code);

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

        await Commands.handle(cmd, {
          args,
          content,
          sock,
          key,
          message,
          code,
          text,
        });
        return;
      }

      const [cmd, ...args] = splited.slice(
        splited.findIndex((e) => e.toLowerCase() === prefix) + 1,
      );

      if (!cmd) {
        await sock.sendMessage(
          key.remoteJid,
          { text: Language.get("hearing.start", "?") },
          { quoted: message },
        );
        await sock.readMessages([key]);
        isHearing = true;

        return;
      }

      await Commands.handle(cmd, {
        args,
        content,
        sock,
        key,
        message,
        code,
        text,
      });
    });
  });
}

main();
