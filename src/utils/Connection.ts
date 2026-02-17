import type { Boom } from "@hapi/boom";
import {
  DisconnectReason,
  type ConnectionState,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { Terminal } from "./Terminal";

/**
 * Utility class to create or handle connection
 */
class Connection {
  /**
   * Handle connecting process
   * @param event connection state from baileys
   * @param main main function
   */
  static async startEvent(
    event: Partial<ConnectionState>,
    main: () => Promise<void>,
  ): Promise<void> {
    const { connection, lastDisconnect } = event;
    if (
      connection === "close" &&
      (lastDisconnect?.error as Boom)?.output?.statusCode ===
        DisconnectReason.restartRequired
    ) {
      Terminal.info("Restarting");
      main();
    }

    if (event.qr) {
      console.log(await QRCode.toString(event.qr));
    }
  }
}

export { Connection };
