import { DevtoClient } from '../api/devto_client.js';
import { CredentialStore } from '../config/credential_store.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommandClient — creates the DevtoClient of a command with its API key
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The API key that a command uses, and the place where the API key comes from.
 */
export type CommandApiKey = {
	/** The dev.to API key. */
	apiKey: string;
	/** The place where the API key comes from: the environment variable, or the path of the credential file. */
	source: string;
};

/**
 * Creates the `DevtoClient` of a command with the API key of the environment variable `DEVTO_API_KEY`, or with the
 * stored API key.
 */
export class CommandClient {
	/** The name of the environment variable that holds the API key. It wins over the credential file. */
	static readonly API_KEY_ENV_NAME = 'DEVTO_API_KEY';

	/**
	 * Create a client with the API key of the environment variable `DEVTO_API_KEY`, or with the stored API key.
	 *
	 * @returns The client.
	 */
	static async create(): Promise<DevtoClient> {
		const commandApiKey = await CommandClient.loadApiKey();
		if (commandApiKey === null) {
			throw new Error(`No API key. Run \`devto_cli login\` first, or set ${CommandClient.API_KEY_ENV_NAME}.`);
		}
		return new DevtoClient({
			apiKey: commandApiKey.apiKey,
		});
	}

	/**
	 * Read the API key of the environment variable `DEVTO_API_KEY`, or else the stored API key.
	 *
	 * @param env The environment variables. The default is `process.env`.
	 * @param credentialStore The credential store. The default is the credential store of the home folder.
	 * @returns The API key and its source, or null when there is no API key.
	 */
	static async loadApiKey(
		env: NodeJS.ProcessEnv = process.env,
		credentialStore: CredentialStore = new CredentialStore(),
	): Promise<CommandApiKey | null> {
		const envApiKey = (env[CommandClient.API_KEY_ENV_NAME] ?? '').trim();
		if (envApiKey.length > 0) {
			return {
				apiKey: envApiKey,
				source: `the environment variable ${CommandClient.API_KEY_ENV_NAME}`,
			};
		}

		const credential = await credentialStore.load();
		if (credential === null) {
			return null;
		}
		return {
			apiKey: credential.apiKey,
			source: credentialStore.filePath,
		};
	}

	/**
	 * Parse a positive integer of the command line, for example an identifier or a page number.
	 *
	 * @param valueStr The value of the command line.
	 * @param name The name of the value, for the error message.
	 * @returns The integer.
	 */
	static parsePositiveInteger(valueStr: string, name: string): number {
		const value = Number(valueStr);
		if (Number.isInteger(value) === false || value < 1) {
			throw new Error(`The ${name} "${valueStr}" is not a positive integer.`);
		}
		return value;
	}
}
