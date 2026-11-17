import { DevtoClient } from '../api/devto_client.js';
import { CredentialStore } from '../config/credential_store.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommandClient — creates the DevtoClient of a command with the stored API key
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Creates the `DevtoClient` of a command with the stored API key.
 */
export class CommandClient {
	/**
	 * Create a client with the stored API key.
	 *
	 * @returns The client.
	 */
	static async create(): Promise<DevtoClient> {
		const credential = await new CredentialStore().load();
		if (credential === null) {
			throw new Error('No stored API key. Run `devto_cli login` first.');
		}
		return new DevtoClient({
			apiKey: credential.apiKey,
		});
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
