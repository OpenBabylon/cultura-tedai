import { createSharedComposable } from '@vueuse/core';
import { type ConnectionState, RoomEvent } from 'livekit-client';
import { ref } from 'vue';

import { onRoomEvent } from './onRoomEvent';
import { useRoomContext } from './useRoomContext';

export const useConnectionState = createSharedComposable(() => {
	const { room } = useRoomContext();
	const state = ref<ConnectionState>(room.state);

	onRoomEvent(RoomEvent.ConnectionStateChanged, () => {
		state.value = room.state;
	});

	return state;
});
