import type { FetchFn } from '../src/api/devto_client.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	FakeFetch — a fake fetch function that records each request, for the tests of DevtoClient
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * One request that the fake fetch function received.
 */
export type SentRequest = {
	/** The address of the request. */
	url: string;
	/** The options of the request. */
	init: RequestInit;
};

/**
 * One answer of the fake fetch function.
 */
export type FakeAnswer = {
	/** The HTTP status. */
	status: number;
	/** The body, sent as JSON. */
	body: unknown;
};

/**
 * A fake fetch function that records each request, and gives the answers in order.
 */
export class FakeFetch {
	/** The requests that the fake fetch function received. */
	readonly sentRequests: SentRequest[] = [];
	/** The answers that are not given yet. */
	private readonly _answers: FakeAnswer[];

	/**
	 * @param answers The answers, in order; the last answer is given again when there are more requests.
	 */
	constructor(answers: FakeAnswer[]) {
		this._answers = answers;
	}

	/**
	 * Give the fake fetch function.
	 *
	 * @returns The fake fetch function.
	 */
	get fetchFn(): FetchFn {
		return async (url: string, init: RequestInit) => {
			this.sentRequests.push({
				url,
				init,
			});
			const answer = this._answers.length > 1 ? this._answers.shift() : this._answers[0];
			if (answer === undefined) {
				throw new Error('The fake fetch function has no answer.');
			}
			return new Response(JSON.stringify(answer.body), {
				status: answer.status,
			});
		};
	}

	/**
	 * Give the body of a request, parsed from JSON.
	 *
	 * @param index The index of the request.
	 * @returns The body.
	 */
	jsonBodyOf(index: number): unknown {
		return JSON.parse(String(this.sentRequests[index].init.body));
	}
}
