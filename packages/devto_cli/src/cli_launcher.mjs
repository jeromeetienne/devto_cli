#!/usr/bin/env node
import { tsImport } from 'tsx/esm/api';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CliLauncher — starts the TypeScript command line devto_cli from its installed package
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The root package.json registers this file as the command devto_cli, so that
 * `npx --yes github:jeromeetienne/devto_cli` runs devto_cli from any folder, without the npm registry and without a
 * build. Node.js runs this file, imports tsx from the dependencies of the installed package, and tsx loads and runs
 * cli.ts. Passing import.meta.url resolves cli.ts relative to this file, whatever the current folder of the caller.
 */
await tsImport('./cli.ts', import.meta.url);
