<script lang="ts" setup>
import type { Participant } from 'livekit-client';
import { computed } from 'vue';

import { useRemoteParticipants } from '../composables/useRemoteParticipants';
import { useRoomContext } from '../composables/useRoomContext';
import ParticipantItem from './ParticipantItem.vue';

const participants = useRemoteParticipants();
const { leaderId } = useRoomContext();

const isLeader = (participant: Participant) => {
	return leaderId.value === participant.identity;
};

const gridLayout = computed(() => {
	if (participants.value.length < 2) {
		return '';
	}

	return 'grid-cols-2 grid-flow-row';
});
</script>

<template>
	<div class="h-full grid gap-4" :class="gridLayout" section="participants">
		<ParticipantItem
			v-for="(participant, idx) of participants"
			:key="participant.identity"
			:item="participant"
			:data-leader="isLeader(participant)"
			:class="{
				'col-start-1 col-end-4 order-1':
					(false && participants.length === 1) || (false && leaderId === participant.identity),
			}"
		/>
	</div>
</template>
