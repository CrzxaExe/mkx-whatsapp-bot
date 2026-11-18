import type { Boom } from "@hapi/boom";
import {
  DisconnectReason,
  type ConnectionState,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { Terminal } from "./Terminal.ts";

/**
 * Utility class to create or handle connection
 */
class Connection {
  static isReady = false;

  /**
   * Handle connecting process
   * @param event connection state from baileys
   * @param main main function
   */
  static async startEvent(
    event: Partial<ConnectionState>,
    main: () => Promise<void>,
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = event;

    if (qr) {
      console.log(await QRCode.toString(qr));
    }

    if (connection === "open") {
      Connection.isReady = true;
      Terminal.info("Connected to WhatsApp");
    }

    if (connection === "close") {
      Connection.isReady = false;

      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) {
        Terminal.info("Connection closed; reconnecting...");
        setTimeout(() => main(), 3000);
      } else {
        Terminal.error("Logged out, please re-authenticate");
      }
    }
  }
}

export { Connection };
