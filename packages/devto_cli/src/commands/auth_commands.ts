import Chalk from 'chalk';
import type { Command } from 'commander';
import { DevtoClient } from '../api/devto_client.js';
import { CredentialStore } from '../config/credential_store.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	AuthCommands — the commands login, status, and logout of the API key
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The commands `login`, `status`, and `logout`.
 */
export class AuthCommands {
	/**
	 * Add the commands `login`, `status`, and `logout` to the program.
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
				await AuthCommands._login(options.apiKey);
			});

		program
			.command('status')
			.description('say whether an API key is stored, and whether dev.to accepts it')
			.action(async () => {
				await AuthCommands._status();
			});

		program
			.command('logout')
			.description('delete the stored API key')
			.action(async () => {
				await AuthCommands._logout();
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
	private static async _login(apiKeyOption: string | undefined): Promise<void> {
		const apiKey = (apiKeyOption ?? await AuthCommands._readStdin()).trim();
		if (apiKey.length === 0) {
			throw new Error('No API key. Give --api-key, or write the API key on the standard input.');
		}

		const client = new DevtoClient({
			apiKey,
		});
		const user = await client.getMe();
		const credentialStore = new CredentialStore();
		await credentialStore.save(apiKey);
		console.log(`${Chalk.green('Logged in')} as @${user.username}. The API key is in ${credentialStore.filePath}`);
	}

	/**
	 * Say whether an API key is stored, and whether dev.to accepts it. The exit code is 1 when the user is not
	 * logged in, or when dev.to refuses the API key.
	 *
	 * @returns Nothing.
	 */
	private static async _status(): Promise<void> {
		const credentialStore = new CredentialStore();
		const credential = await credentialStore.load();
		if (credential === null) {
			console.log(`${Chalk.yellow('Not logged in')}: no API key in ${credentialStore.filePath}`);
			process.exitCode = 1;
			return;
		}

		const client = new DevtoClient({
			apiKey: credential.apiKey,
		});
		try {
			const user = await client.getMe();
			console.log(`${Chalk.green('Logged in')} as @${user.username}. dev.to accepts the API key.`);
			console.log(Chalk.dim(`The API key is in ${credentialStore.filePath}`));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.log(`${Chalk.red('API key not valid')}: an API key is stored, but the check failed.`);
			console.log(Chalk.dim(message));
			process.exitCode = 1;
		}
	}

	/**
	 * Delete the stored API key.
	 *
	 * @returns Nothing.
	 */
	private static async _logout(): Promise<void> {
		const credentialStore = new CredentialStore();
		const isDeleted = await credentialStore.delete();
		if (isDeleted === false) {
			console.log(`${Chalk.yellow('Not logged in')}: there is no API key to delete.`);
			return;
		}
		console.log(`${Chalk.green('Logged out')}: deleted ${credentialStore.filePath}`);
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
