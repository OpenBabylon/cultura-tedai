import { HttpClient } from '@cultura-ai/http-client';
import { env } from '@cultura-ai/shared';

let httpClient: HttpClient | undefined;

export function useHTTP() {
	if (!httpClient) {
		httpClient = new HttpClient({
			name: 'api',
			basePath: env.string('VITE_APP_API_ENDPOINT', 'http://localhost:3000/api'),
		});
	}

	return httpClient!;
}
