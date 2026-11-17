///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	DevtoApiError — the error of a request that the dev.to API refuses
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The error of a request that the dev.to API refuses, with the HTTP status.
 */
export class DevtoApiError extends Error {
	/** The HTTP status of the response. */
	readonly status: number;

	/**
	 * @param status The HTTP status of the response.
	 * @param message The message of the error.
	 */
	constructor(status: number, message: string) {
		super(message);
		this.name = 'DevtoApiError';
		this.status = status;
	}
}
