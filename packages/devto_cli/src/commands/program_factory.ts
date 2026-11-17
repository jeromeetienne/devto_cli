import { Command } from 'commander';
import { AnalyticsCommands } from './analytics_commands.js';
import { ArticleCommands } from './article_commands.js';
import { AuthCommands } from './auth_commands.js';
import { CommentCommands } from './comment_commands.js';
import { ImageCommands } from './image_commands.js';
import { SearchCommands } from './search_commands.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ProgramFactory — creates the Commander.js program with all the commands
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Creates the Commander.js program with all the commands.
 */
export class ProgramFactory {
	/**
	 * Create the program.
	 *
	 * @returns The program, with all the commands.
	 */
	static create(): Command {
		const program = new Command();
		program
			.name('devto_cli')
			.description('Command-line client for the dev.to API, with a login');
		AuthCommands.register(program);
		ArticleCommands.register(program);
		ImageCommands.register(program);
		CommentCommands.register(program);
		AnalyticsCommands.register(program);
		SearchCommands.register(program);
		return program;
	}
}
