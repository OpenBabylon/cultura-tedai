import { createSharedComposable } from '@vueuse/core';
import type { ShallowRef } from 'vue';

import { type ParticipantPermission, useParticipantPermissions } from './useParticipantPermissions';
import { useRoomContext } from './useRoomContext';

export const useLocalParticipantPermissions = createSharedComposable(
	(): ShallowRef<ParticipantPermission | undefined> => {
		const { room } = useRoomContext();
		return useParticipantPermissions(room.localParticipant);
	},
);
