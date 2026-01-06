
/**
 * Returns a Tailwind color code based on the provided HTTP status code.
 * @param status - The HTTP status code.
 * @returns A string representing the Tailwind color code.
*/
export function getStatusColor(status: number): string {
	const firstDigit = Math.floor(status / 100);
	
	if (firstDigit === 2) return 'bg-lime-500';
	if (firstDigit === 3) return 'bg-cyan-500';
	if (firstDigit === 4) return 'bg-amber-500';
	if (firstDigit === 5) return 'bg-red-500';
	return 'bg-gray-500';
}

type SendRequestResult = { success: true; status: number; responseTime: number } | { success: false; error: string };
/**
 * Sends an HTTP request with a timeout and returns status and timing information.
 * @param url - The URL to request.
 * @param timeout - Request timeout in milliseconds.
 * @returns An object containing status code, response time, and error information.
 */
export async function sendRequest(url: string, timeout: number): Promise<SendRequestResult> {
	let response: Response | undefined = undefined;
	let error: Error | undefined = undefined;
	const startTime = new Date();

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		response = await fetch(url, { signal: controller.signal });
		clearTimeout(timeoutId);
	} catch (err) {
		error = err instanceof Error ? err : new Error('Unknown error');
	}

	const endTime = new Date();
	const responseTime = endTime.getTime() - startTime.getTime();

	if (response && !error) {
		return {
			success: true,
			status: response.status,
			responseTime,
		};
	} else {
		const errorMessage = error ? (error.name === 'AbortError' ? 'Request timed out' : error.message) : 'Unknown error';
		return { success: false, error: errorMessage };
	}
}
