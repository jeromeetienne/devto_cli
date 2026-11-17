import Chalk from 'chalk';
import type { Command } from 'commander';
import { DevtoClient } from '../api/devto_client.js';
import { CredentialStore } from '../config/credential_store.js';
import { CommandClient } from './command_client.js';

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
			.description('ask for the dev.to API key, check it, and store it in the home folder of the user')
			.action(async () => {
				await AuthCommands._login();
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

	/** The page of the dev.to settings where the user creates an API key. */
	private static readonly API_KEY_PAGE_URL = 'https://dev.to/settings/extensions';

	/**
	 * Read the API key, check the API key with dev.to, then store the API key. In a terminal, ask for the API key
	 * and hide what the user types. Else, read the API key from the standard input.
	 *
	 * @returns Nothing.
	 */
	private static async _login(): Promise<void> {
		let apiKeyStr: string;
		if (process.stdin.isTTY === true) {
			process.stderr.write(`Create an API key at ${AuthCommands.API_KEY_PAGE_URL}\n`);
			apiKeyStr = await AuthCommands._readHidden('Paste your dev.to API key: ');
		} else {
			apiKeyStr = await AuthCommands._readStdin();
		}
		const apiKey = apiKeyStr.trim();
		if (apiKey.length === 0) {
			throw new Error('No API key. Paste the API key, or write the API key on the standard input.');
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
		const commandApiKey = await CommandClient.loadApiKey(process.env, credentialStore);
		if (commandApiKey === null) {
			console.log(`${Chalk.yellow('Not logged in')}: no API key in ${credentialStore.filePath}, `
				+ `and no ${CommandClient.API_KEY_ENV_NAME}.`);
			process.exitCode = 1;
			return;
		}

		const client = new DevtoClient({
			apiKey: commandApiKey.apiKey,
		});
		try {
			const user = await client.getMe();
			console.log(`${Chalk.green('Logged in')} as @${user.username}. dev.to accepts the API key.`);
			console.log(Chalk.dim(`The API key comes from ${commandApiKey.source}`));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.log(`${Chalk.red('API key not valid')}: dev.to refuses the API key of ${commandApiKey.source}.`);
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
	 * Ask a question in the terminal, and read the answer without showing it. Enter ends the answer, Backspace
	 * deletes the last character, and Control-C or Control-D cancels.
	 *
	 * @param question The question, written on the standard error.
	 * @returns The answer.
	 */
	private static async _readHidden(question: string): Promise<string> {
		process.stderr.write(question);
		const stdin = process.stdin;
		stdin.setRawMode(true);
		stdin.setEncoding('utf8');
		stdin.resume();
		try {
			return await new Promise<string>((resolve, reject) => {
				let answer = '';
				const onData = (text: string): void => {
					for (const character of text) {
						if (character === '\r' || character === '\n') {
							stdin.off('data', onData);
							resolve(answer);
							return;
						}
						if (character === '\u0003' || character === '\u0004') {
							stdin.off('data', onData);
							reject(new Error('Login cancelled.'));
							return;
						}
						if (character === '\u007f' || character === '\b') {
							answer = answer.slice(0, -1);
							continue;
						}
						answer += character;
					}
				};
				stdin.on('data', onData);
			});
		} finally {
			stdin.setRawMode(false);
			stdin.pause();
			process.stderr.write('\n');
		}
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
