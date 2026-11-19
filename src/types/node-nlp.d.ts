declare module "node-nlp" {
	export class NlpManager {
		constructor(options?: Record<string, unknown>);

		container: Record<string, unknown>;

		addDocument(locale: string, text: string, intent: string): void;
		addAnswer(locale: string, intent: string, answer: string): void;
		addRegexEntity(name: string, locale: string, regex: RegExp): void;

		train(): Promise<void>;
		process(locale: string, text: string): Promise<Record<string, unknown>>;
		save(path?: string): void;
		load(path?: string): void;
	}
}
