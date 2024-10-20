import { HttpError } from '@cultura-ai/http-client';
import { NavigationResult } from 'unplugin-vue-router/data-loaders';
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic';

export const useAuthGuard = defineBasicLoader(async () => {
	try {
		// TODO: implement user request here
		const isAuthorized = false;

		if (!isAuthorized) {
			throw new HttpError('Unauthorized', 401);
		}
	} catch (err) {
		if (HttpError.is(err) && err.statusCode === 401) {
			// same as returning '/login' in a navigation guard
			return new NavigationResult('/login');
		}
		throw err; // unexpected error
	}
});
