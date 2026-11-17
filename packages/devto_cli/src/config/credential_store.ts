import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { CredentialSchema } from './credential_types.js';
import type { Credential } from './credential_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CredentialStore — reads and writes the API key in the home folder of the user
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Reads and writes the credential file, at `~/.config/devto_cli/credentials.json` by default.
 */
export class CredentialStore {
	/** The folder that holds the credential file. */
	private readonly _configDir: string;

	/**
	 * @param configDir The folder that holds the credential file. The default is `~/.config/devto_cli`.
	 */
	constructor(configDir?: string) {
		this._configDir = configDir ?? Path.join(Os.homedir(), '.config', 'devto_cli');
	}

	/**
	 * The path of the credential file.
	 *
	 * @returns The path of the credential file.
	 */
	get filePath(): string {
		return Path.join(this._configDir, 'credentials.json');
	}

	/**
	 * Write the API key in the credential file. Only the user can read the file.
	 *
	 * @param apiKey The dev.to API key.
	 * @returns Nothing.
	 */
	async save(apiKey: string): Promise<void> {
		const credential: Credential = CredentialSchema.parse({
			apiKey,
		});
		await Fs.promises.mkdir(this._configDir, {
			recursive: true,
			mode: 0o700,
		});
		await Fs.promises.writeFile(this.filePath, `${JSON.stringify(credential, null, '\t')}\n`, {
			mode: 0o600,
		});
		await Fs.promises.chmod(this.filePath, 0o600);
	}

	/**
	 * Read the credential file.
	 *
	 * @returns The credential, or null when the file does not exist.
	 */
	async load(): Promise<Credential | null> {
		let text: string;
		try {
			text = await Fs.promises.readFile(this.filePath, 'utf8');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return null;
			}
			throw error;
		}
		return CredentialSchema.parse(JSON.parse(text));
	}
}
