import { tryOnScopeDispose } from '@vueuse/core';
import type { Participant } from 'livekit-client';
import type { ParticipantEventCallbacks } from 'node_modules/livekit-client/dist/src/room/participant/Participant';
import { type MaybeRefOrGetter, toValue, watch } from 'vue';

type CancelCallback = () => void;

export function onParticipantEvent<T extends keyof ParticipantEventCallbacks>(
	participant: MaybeRefOrGetter<Participant>,
	event: T,
	listener: ParticipantEventCallbacks[T],
): CancelCallback {
	let _cancel: CancelCallback | undefined;

	const cancel = () => {
		if (_cancel) _cancel();
		_cancel = undefined;
	};

	watch(
		() => toValue(participant),
		(participant) => {
			cancel();

			participant.on(event, listener);

			_cancel = () => {
				participant.off(event, listener);
			};
		},
		{ immediate: true },
	);

	tryOnScopeDispose(cancel);

	return cancel;
}
