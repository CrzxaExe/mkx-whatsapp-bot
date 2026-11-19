import fs from "fs";
import { NlpManager } from "node-nlp";
import { LocalData } from "../utils/LocalData";
import { CONFIG } from "../constant/config";
import { Terminal } from "../utils/Terminal";
import type { TrainingFile } from "../types/model";
import { Commands } from "../utils/Commands";

const client = new NlpManager({
  languages: [LocalData._data.bot.system_language],
  forceNER: true,
  modelFileName: CONFIG.MODEL_PATH,
});

export const Manager = {
  /**
   * Setupping model
   */
  async setup(): Promise<void> {
    // Checking if model is already exist
    // So it will load that directly without training first
    if (fs.existsSync(CONFIG.MODEL_PATH)) {
      Terminal.log("Found model file, loading nlp model...");
      this.load();

      return;
    }
    // Do training if no model found
    if (!fs.existsSync(CONFIG.TRAINING_PATH)) {
      Terminal.error("Training file not found in: ", CONFIG.TRAINING_PATH);
      process.exit(1);
    }

    Terminal.log("Training model");
    const file = await Bun.file(CONFIG.TRAINING_PATH, { type: "json" }).json();

    await this.train(file as TrainingFile);
  },

  /**
   * Training NLP model
   * @param file training file content (json)
   */
  async train(file: TrainingFile): Promise<void> {
    // Storing command into one array collection
    // the field needed are alias and name
    const commands = Commands.data.map((e) => {
      return {
        name: e.config.name,
        alias: [
          ...e.config.alias,
          ...(file.commands[e.config.name] ?? []).flat(2),
        ],
      };
    });

    // Training nlp
    commands.forEach((e) => {
      client.addDocument("en", e.name, `command.${e.name}`);

      for (const alias of e.alias)
        client.addDocument("en", alias, `command.${e.name}`);

      client.addAnswer("en", `command.${e.name}`, `command.${e.name}.answer`);
    });

    await client.train();
    Terminal.log("Training done");
  },

  /**
   * Process text into Intent
   * @param locale Local language
   * @param text Text want to process
   * @returns NLP Intense
   */
  async process(
    locale: string,
    text: string,
  ): Promise<Record<string, unknown>> {
    return client.process(locale, text);
  },

  /**
   * Tokenize text
   * @param locale Local language
   * @param text string
   * @returns array of string
   */
  async tokenizer(locale: string, text: string): Promise<string[]> {
    const container = client.container as unknown as {
      get: (key: string) => unknown;
    };
    if (!container) {
      throw new Error(
        `NLP container is not initialized for locale "${locale}"`,
      );
    }

    const tokenizer = container.get(`tokenizer-${locale}`) as {
      tokenize: (value: string) => string[];
    };
    const token = tokenizer.tokenize(text);

    return token as string[];
  },

  /**
   * Stimming word
   * @param locale Local language
   * @param word string
   * @returns stemmed word
   */
  async stemmer(locale: string, word: string): Promise<string> {
    const container = client.container as unknown as {
      get: (key: string) => unknown;
    };
    if (!container) {
      throw new Error(
        `NLP container is not initialized for locale "${locale}"`,
      );
    }

    const stemmer = container.get(`stemmer-${locale}`) as {
      stem: (value: string) => string;
    };

    return stemmer.stem(word) as string;
  },

  /**
   * Check is the word are stop word
   * @param locale Local language
   * @param word string
   * @returns boolean
   */
  stopWord(locale: string, word: string): boolean {
    const container = client.container as unknown as {
      get: (key: string) => unknown;
    };
    if (!container) {
      throw new Error(
        `NLP container is not initialized for locale "${locale}"`,
      );
    }

    const stopWord = container.get(`stopwords-${locale}`) as {
      isStopword: (value: string) => boolean;
    };

    return stopWord.isStopword(word) as boolean;
  },

  save(): void {
    client.save(CONFIG.MODEL_PATH);
  },
  load(): void {
    client.load(CONFIG.MODEL_PATH);
  },
};
