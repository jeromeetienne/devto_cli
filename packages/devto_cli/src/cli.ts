#!/usr/bin/env node
import { Command } from 'commander';
import { ArticleCommands } from './commands/article_commands.js';
import { AuthCommands } from './commands/auth_commands.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Cli — the entry point of the command line devto_cli
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The entry point of the command line `devto_cli`.
 */
export class Cli {
	/**
	 * Parse the arguments and run the command.
	 *
	 * @param argv The arguments of the process.
	 * @returns Nothing.
	 */
	static async main(argv: string[]): Promise<void> {
		const program = new Command();
		program
			.name('devto_cli')
			.description('Command-line client for the dev.to API, with a login');
		AuthCommands.register(program);
		ArticleCommands.register(program);
		await program.parseAsync(argv);
	}
}

try {
	await Cli.main(process.argv);
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
