import { createSharedComposable } from '@vueuse/core';
import { RemoteParticipant, RoomEvent } from 'livekit-client';
import { type ShallowRef, markRaw, shallowRef } from 'vue';

import { onRoomEvent } from './onRoomEvent';
import { useRoomContext } from './useRoomContext';

export const useRemoteParticipants = createSharedComposable((): ShallowRef<RemoteParticipant[]> => {
	const { room } = useRoomContext();
	const participants = shallowRef<RemoteParticipant[]>([]);

	const update = () => {
		participants.value = [
			...Array.from(room.remoteParticipants.values()),
			// ...Array.from(room.remoteParticipants.values()),
			// ...Array.from(room.remoteParticipants.values()),
			// ...Array.from(room.remoteParticipants.values()),
			// ...Array.from(room.remoteParticipants.values()),
			// ...Array.from(room.remoteParticipants.values()),
			// ...Array.from(room.remoteParticipants.values()),
		].map(markRaw);
	};

	onRoomEvent(RoomEvent.ParticipantConnected, update);
	onRoomEvent(RoomEvent.ParticipantDisconnected, update);
	onRoomEvent(RoomEvent.ConnectionStateChanged, update);

	update();

	return participants;
});
