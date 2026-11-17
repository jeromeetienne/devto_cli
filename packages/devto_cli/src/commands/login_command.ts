import type { Command } from 'commander';
import { DevtoClient } from '../api/devto_client.js';
import { CredentialStore } from '../config/credential_store.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	LoginCommand — checks the API key and stores the API key in the home folder of the user
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The command `login`.
 */
export class LoginCommand {
	/**
	 * Add the command `login` to the program.
	 *
	 * @param program The Commander.js program.
	 * @returns Nothing.
	 */
	static register(program: Command): void {
		program
			.command('login')
			.description('check the dev.to API key, and store it in the home folder of the user')
			.option('--api-key <apiKey>', 'the dev.to API key; when not given, read from the standard input')
			.action(async (options: { apiKey?: string }) => {
				await LoginCommand._run(options.apiKey);
			});
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Check the API key with dev.to, then store the API key.
	 *
	 * @param apiKeyOption The API key from the command line, or undefined.
	 * @returns Nothing.
	 */
	private static async _run(apiKeyOption: string | undefined): Promise<void> {
		const apiKey = (apiKeyOption ?? await LoginCommand._readStdin()).trim();
		if (apiKey.length === 0) {
			throw new Error('No API key. Give --api-key, or write the API key on the standard input.');
		}

		const client = new DevtoClient({
			apiKey,
		});
		const user = await client.getMe();
		const credentialStore = new CredentialStore();
		await credentialStore.save(apiKey);
		console.log(`Logged in as @${user.username}. The API key is in ${credentialStore.filePath}`);
	}

	/**
	 * Read all the standard input.
	 *
	 * @returns The text of the standard input.
	 */
	private static async _readStdin(): Promise<string> {
		const chunks: Buffer[] = [];
		for await (const chunk of process.stdin) {
			chunks.push(chunk as Buffer);
		}
		return Buffer.concat(chunks).toString('utf8');
	}
}
