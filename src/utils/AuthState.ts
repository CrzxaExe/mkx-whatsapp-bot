import AsyncLock from "async-lock";
import { stat, unlink, mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { proto, initAuthCreds, BufferJSON } from "@whiskeysockets/baileys";
import type {
  AuthenticationState,
  AuthenticationCreds,
  SignalKeyStore,
} from "@whiskeysockets/baileys";

const fileLock = new AsyncLock({ maxPending: Infinity });

function fixFileName(file: string): string {
  return file.replace(/\//g, "__").replace(/:/g, "-");
}

export async function useMultiFileAuthState(folder: string): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const writeData = async (data: any, file: string): Promise<void> => {
    const filePath = join(folder, fixFileName(file));
    await fileLock.acquire(filePath, async () => {
      await writeFile(filePath, JSON.stringify(data, BufferJSON.replacer));
    });
  };

  const readData = async (file: string): Promise<any> => {
    try {
      const filePath = join(folder, fixFileName(file));
      const data = await fileLock.acquire(filePath, async () => {
        return await readFile(filePath, { encoding: "utf-8" });
      });
      return JSON.parse(data, BufferJSON.reviver);
    } catch {
      return null;
    }
  };

  const removeData = async (file: string): Promise<void> => {
    try {
      const filePath = join(folder, fixFileName(file));
      await fileLock.acquire(filePath, async () => {
        await unlink(filePath);
      });
    } catch {
      // ignore
    }
  };

  const folderInfo = await stat(folder).catch(() => undefined);
  if (folderInfo) {
    if (!folderInfo.isDirectory()) {
      throw new Error(
        `found something that is not a directory at ${folder}, either delete it or specify a different location`,
      );
    }
  } else {
    await mkdir(folder, { recursive: true });
  }

  const creds: AuthenticationCreds =
    (await readData("creds.json")) || initAuthCreds();

  const keys: SignalKeyStore = {
    get: async (type, ids) => {
      const data: any = {};
      await Promise.all(
        ids.map(async (id) => {
          let value = await readData(`${type}-${id}.json`);
          if (type === "app-state-sync-key" && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }
          data[id] = value;
        }),
      );
      return data;
    },
    set: async (data) => {
      const tasks: Promise<void>[] = [];
      for (const category of Object.keys(data) as Array<keyof typeof data>) {
        const categoryData = data[category] as any;
        if (!categoryData) continue;
        for (const id of Object.keys(categoryData)) {
          const value = categoryData[id];
          const file = `${category}-${id}.json`;
          tasks.push(value ? writeData(value, file) : removeData(file));
        }
      }
      await Promise.all(tasks);
    },
  };

  const state: AuthenticationState = {
    creds,
    keys,
  };

  const saveCreds = async (): Promise<void> => {
    await writeData(creds, "creds.json");
  };

  return { state, saveCreds };
}
