import { type Participant, ParticipantEvent } from 'livekit-client';
import { type MaybeRefOrGetter, type ShallowRef, shallowRef, toValue, watch } from 'vue';

import { onParticipantEvent } from './onParticipantEvent';

export type ParticipantPermission = Exclude<Participant['permissions'], undefined>;

export function useParticipantPermissions(
	participant: MaybeRefOrGetter<Participant>,
): ShallowRef<ParticipantPermission | undefined> {
	const permissions = shallowRef<ParticipantPermission | undefined>();

	const update = () => {
		permissions.value = toValue(participant).permissions;
	};

	watch(permissions, update, { immediate: true });

	onParticipantEvent(participant, ParticipantEvent.ParticipantPermissionsChanged, update);

	return permissions;
}
