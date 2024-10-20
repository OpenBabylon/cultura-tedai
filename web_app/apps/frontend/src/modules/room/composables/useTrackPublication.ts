import { RemoteTrackPublication } from 'livekit-client';
import { type MaybeRefOrGetter, onBeforeUnmount, toValue, watch } from 'vue';

import type { TrackReferenceOrPlaceholder } from './useTracks';

export function useTrackPublication(
	track: MaybeRefOrGetter<TrackReferenceOrPlaceholder>,
	attachElement: MaybeRefOrGetter<HTMLMediaElement | undefined>,
) {
	watch(
		() => toValue(track).publication,
		(publication, oldPublication) => {
			if (isRemoteTrackPublication(oldPublication)) {
				oldPublication.setSubscribed(false);
			}

			if (isRemoteTrackPublication(publication)) {
				publication.setSubscribed(true);
			}
		},
		{ immediate: true },
	);

	watch(
		[() => toValue(attachElement), () => toValue(track).publication?.track],
		([el, track], [oldEl, oldTrack]) => {
			if (oldEl && oldTrack) {
				oldTrack.detach(oldEl);
			}

			if (el && track) {
				track.attach(el);
			}
		},
		{ immediate: true },
	);

	onBeforeUnmount(() => {
		const publication = toValue(track).publication;

		if (isRemoteTrackPublication(publication)) {
			publication.setSubscribed(false);
		}

		if (publication?.track) {
			publication.track.detach(toValue(attachElement)!);
		}
	});
}

const isRemoteTrackPublication = (value: any): value is RemoteTrackPublication => {
	return value && value instanceof RemoteTrackPublication;
};
