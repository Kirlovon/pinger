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