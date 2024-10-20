import { tryOnScopeDispose } from '@vueuse/core';
import {
	type CreateLocalTracksOptions,
	type LocalTrack,
	Mutex,
	createLocalTracks,
} from 'livekit-client';
import { type MaybeRefOrGetter, shallowRef, toValue, watch } from 'vue';

export function usePreviewTracks(
	optionsRef: MaybeRefOrGetter<CreateLocalTracksOptions>,
	onError?: (err: Error) => void,
) {
	const tracks = shallowRef<LocalTrack[]>([]);
	const trackLock = new Mutex();

	const clean = () => {
		tracks.value.forEach((tr) => tr.stop());
	};

	tryOnScopeDispose(clean);

	watch(
		() => toValue(optionsRef),
		async (options) => {
			clean();
			const unlock = await trackLock.lock();

			try {
				if (options.audio || options.video) {
					tracks.value = await createLocalTracks(options);
				}
			} catch (err) {
				if (onError && err instanceof Error) {
					onError(err);
				} else {
					console.error(err);
				}
			} finally {
				unlock();
			}
		},
		{ immediate: true },
	);

	return tracks;
}
