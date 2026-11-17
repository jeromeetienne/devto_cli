import Assert from 'node:assert/strict';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Test from 'node:test';
import { CredentialStore } from '../src/config/credential_store.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CredentialStoreTest — checks that the API key is stored and read back
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

Test.test('load returns null when there is no credential file', async () => {
	const configDir = await Fs.promises.mkdtemp(Path.join(Os.tmpdir(), 'devto_cli-'));
	const credentialStore = new CredentialStore(configDir);
	Assert.equal(await credentialStore.load(), null);
});

Test.test('save writes a file that only the user can read, and load reads it back', async () => {
	const configDir = Path.join(await Fs.promises.mkdtemp(Path.join(Os.tmpdir(), 'devto_cli-')), 'nested');
	const credentialStore = new CredentialStore(configDir);
	await credentialStore.save('test-key');
	const credential = await credentialStore.load();
	Assert.deepEqual(credential, {
		apiKey: 'test-key',
	});
	const stats = await Fs.promises.stat(credentialStore.filePath);
	Assert.equal(stats.mode & 0o777, 0o600);
});

Test.test('delete removes the credential file, and returns false when there is no file', async () => {
	const configDir = await Fs.promises.mkdtemp(Path.join(Os.tmpdir(), 'devto_cli-'));
	const credentialStore = new CredentialStore(configDir);
	await credentialStore.save('test-key');
	Assert.equal(await credentialStore.delete(), true);
	Assert.equal(await credentialStore.load(), null);
	Assert.equal(await credentialStore.delete(), false);
});

Test.test('save refuses an empty API key', async () => {
	const configDir = await Fs.promises.mkdtemp(Path.join(Os.tmpdir(), 'devto_cli-'));
	const credentialStore = new CredentialStore(configDir);
	await Assert.rejects(credentialStore.save(''));
});
