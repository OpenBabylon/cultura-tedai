import { createSharedComposable } from '@vueuse/core';
import { type ShallowRef, shallowRef } from 'vue';

import { type UseParticipantResult, useParticipant } from './useParticipant';
import { useRoomContext } from './useRoomContext';

export type UseLocalParticipant = UseParticipantResult & {
	lastCameraError: ShallowRef<Error | undefined>;
	lastMicrophoneError: ShallowRef<Error | undefined>;
};

export const useLocalParticipant = createSharedComposable((): UseLocalParticipant => {
	const { room } = useRoomContext();

	const lastCameraError = shallowRef<Error | undefined>();
	const lastMicrophoneError = shallowRef<Error | undefined>();

	const participant = useParticipant(room.localParticipant, (p) => {
		lastCameraError.value = p.lastCameraError;
		lastMicrophoneError.value = p.lastMicrophoneError;
	});

	return {
		...participant,
		lastCameraError,
		lastMicrophoneError,
	};
});
