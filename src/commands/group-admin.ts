import type { CommandParams } from "../types/command";
import { Commands } from "../utils/Commands";
import { Language } from "../utils/Language";

Commands.add(
  {
    name: "creategroup",
    alias: ["crtgc"],
    description: "command.group.create",
    category: "group",
    args: ["name"],
  },
  async ({ sock, key, args }: CommandParams): Promise<void> => {
    if (args.length < 1) {
      sock.sendMessage(key.remoteJid!, {
        text: Language.get("group.subject.missing"),
      });
      return;
    }

    const subject = args.join(" ");

    const group = await sock.groupCreate(subject, [key.participant!]);
    sock.groupParticipantsUpdate(group.id, [key.participant!], "promote");

    sock.sendMessage(group.id, { text: Language.get("group.create.greet") });
  },
);

Commands.add(
  {
    name: "setsubject",
    alias: [],
    description: "command.group.subject",
    category: "group",
    args: ["new-name"],
    isAdmin: true,
  },
  async ({ sock, key, args }: CommandParams): Promise<void> => {
    const newName = args.join(" ");
    const old = await sock.groupMetadata(key.remoteJid!);

    await sock.groupUpdateSubject(key.remoteJid!, newName);

    sock.sendMessage(key.remoteJid!, {
      text: Language.get("group.subject.change")
        .replace("%old", old.subject)
        .replace("%new", newName),
    });
  },
);

Commands.add(
  {
    name: "setdescription",
    alias: [],
    description: "command.group.description",
    category: "group",
    args: ["new-description"],
    isAdmin: true,
  },
  async ({ sock, key, args }: CommandParams): Promise<void> => {
    const description = args.slice(1).join(" ");

    await sock.groupUpdateDescription(key.remoteJid!, description);

    sock.sendMessage(key.remoteJid!, {
      text: Language.get("group.description.change"),
    });
  },
);

Commands.add(
  {
    name: "promote",
    alias: [],
    description: "command.group.promote",
    category: "group",
    args: ["mentions"],
    isAdmin: true,
  },
  async ({ sock, key, content }: CommandParams): Promise<void> => {
    const mentions = content.contextInfo?.mentionedJid ?? [];
    if (mentions.length < 1) {
      sock.sendMessage(key.remoteJid!, {
        text: Language.get("group.promote.noMentions"),
      });
      return;
    }

    await sock.groupParticipantsUpdate(key.remoteJid!, mentions, "promote");

    sock.sendMessage(key.remoteJid!, {
      text: Language.get("group.promote.success"),
      mentions,
    });
  },
);

Commands.add(
  {
    name: "demote",
    alias: [],
    description: "command.group.demote",
    category: "group",
    args: ["mentions"],
    isAdmin: true,
  },
  async ({ sock, key, content }: CommandParams): Promise<void> => {
    const mentions = content.contextInfo?.mentionedJid ?? [];
    if (mentions.length < 1) {
      sock.sendMessage(key.remoteJid!, {
        text: Language.get("group.demote.noMentions"),
      });
      return;
    }

    await sock.groupParticipantsUpdate(key.remoteJid!, mentions, "demote");

    sock.sendMessage(key.remoteJid!, {
      text: Language.get("group.demote.success"),
      mentions,
    });
  },
);
