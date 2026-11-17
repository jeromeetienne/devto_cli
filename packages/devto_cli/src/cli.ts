#!/usr/bin/env node
import { ProgramFactory } from './commands/program_factory.js';

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
		await ProgramFactory.create().parseAsync(argv);
	}
}

try {
	await Cli.main(process.argv);
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
