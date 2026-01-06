import { ACCESS_PASSWORD, ACCESS_USERNAME } from '$env/static/private';

// Enable basic authentication if credentials are set
export const isAuthEnabled = typeof ACCESS_PASSWORD === 'string' && typeof ACCESS_USERNAME === 'string' && ACCESS_PASSWORD.length > 0 && ACCESS_USERNAME.length > 0;

/**
 * Check if request is authorized
 * @param request Request
 * @returns boolean indicating if authorized
 */
export function isAuthorized(request: Request): boolean {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) return false;

    const base64Credentials = authHeader.slice(6);
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');

    return username === ACCESS_USERNAME && password === ACCESS_PASSWORD;
}
