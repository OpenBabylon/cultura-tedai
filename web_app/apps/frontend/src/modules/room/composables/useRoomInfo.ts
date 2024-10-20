import { createSharedComposable } from '@vueuse/core';
import { RoomEvent } from 'livekit-client';
import { type Ref, ref } from 'vue';

import { onRoomEvent } from './onRoomEvent';
import { useRoomContext } from './useRoomContext';

export type RoomInfo = {
	name: Ref<string>;
	metadata: Ref<string | undefined>;
};

export const useRoomInfo = createSharedComposable((): RoomInfo => {
	const { room, roomId } = useRoomContext();
	const name = ref(roomId);
	const metadata = ref(room.metadata);

	const update = () => {
		name.value = room.name;
		metadata.value = room.metadata;
	};

	onRoomEvent(RoomEvent.RoomMetadataChanged, update);
	onRoomEvent(RoomEvent.ConnectionStateChanged, update);

	return { name, metadata };
});
