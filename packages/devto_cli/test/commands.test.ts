import Assert from 'node:assert/strict';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Test from 'node:test';
import { AnalyticsCommands } from '../src/commands/analytics_commands.js';
import { CommandClient } from '../src/commands/command_client.js';
import { ProgramFactory } from '../src/commands/program_factory.js';
import { SearchCommands } from '../src/commands/search_commands.js';
import { CredentialStore } from '../src/config/credential_store.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommandsTest — checks that every command exists, and checks the options of the new commands
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Gives the names of the commands of a program.
 */
class CommandNames {
	/**
	 * Give the full name of each command and subcommand, for example `image upload`.
	 *
	 * @returns The full names.
	 */
	static all(): string[] {
		const names: string[] = [];
		for (const command of ProgramFactory.create().commands) {
			names.push(command.name());
			for (const subcommand of command.commands) {
				names.push(`${command.name()} ${subcommand.name()}`);
			}
		}
		return names;
	}
}

Test.test('the program has every command', () => {
	const names = CommandNames.all();
	const expectedNames = [
		'login',
		'status',
		'logout',
		'create',
		'update',
		'get',
		'preview',
		'list',
		'image upload',
		'comment list',
		'comment get',
		'analytics totals',
		'analytics historical',
		'analytics past_day',
		'analytics referrers',
		'search articles',
		'search published',
	];
	for (const expectedName of expectedNames) {
		Assert.ok(names.includes(expectedName), `The command "${expectedName}" is missing.`);
	}
});

Test.test('every command that writes a result has the option --format', () => {
	const program = ProgramFactory.create();
	const noFormatCommands = [
		'login',
		'status',
		'logout',
	];
	for (const command of program.commands) {
		const leafCommands = command.commands.length > 0 ? command.commands : [command];
		for (const leafCommand of leafCommands) {
			if (noFormatCommands.includes(leafCommand.name()) === true) {
				continue;
			}
			const hasFormat = leafCommand.options.some((option) => option.long === '--format');
			Assert.ok(hasFormat, `The command "${leafCommand.name()}" has no option --format.`);
		}
	}
});

Test.test('the analytics options check the article and the days', () => {
	Assert.deepEqual(AnalyticsCommands.toQuery({
		article: '42',
		start: '2026-11-01',
		format: 'tty',
	}), {
		articleId: 42,
		start: '2026-11-01',
	});
	Assert.throws(() => {
		AnalyticsCommands.toQuery({
			start: '01/11/2026',
			format: 'tty',
		});
	}, /YYYY-MM-DD/);
	Assert.throws(() => {
		AnalyticsCommands.toQuery({
			article: 'abc',
			format: 'tty',
		});
	}, /positive integer/);
});

Test.test('the search options check the page', () => {
	Assert.deepEqual(SearchCommands.toPage({
		page: '2',
		perPage: '5',
		format: 'tty',
	}), {
		page: 2,
		perPage: 5,
	});
	Assert.throws(() => {
		CommandClient.parsePositiveInteger('0', 'page');
	}, /positive integer/);
});

Test.test('the API key of DEVTO_API_KEY wins over the stored API key', async () => {
	const configDir = await Fs.promises.mkdtemp(Path.join(Os.tmpdir(), 'devto_cli_test_'));
	try {
		const credentialStore = new CredentialStore(configDir);
		Assert.equal(await CommandClient.loadApiKey({}, credentialStore), null);

		await credentialStore.save('stored-key');
		Assert.deepEqual(await CommandClient.loadApiKey({}, credentialStore), {
			apiKey: 'stored-key',
			source: credentialStore.filePath,
		});

		Assert.deepEqual(await CommandClient.loadApiKey({
			DEVTO_API_KEY: ' env-key ',
		}, credentialStore), {
			apiKey: 'env-key',
			source: 'the environment variable DEVTO_API_KEY',
		});
	} finally {
		await Fs.promises.rm(configDir, {
			recursive: true,
			force: true,
		});
	}
});
