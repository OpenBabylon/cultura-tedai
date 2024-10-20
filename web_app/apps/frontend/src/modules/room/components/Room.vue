<script lang="ts" setup>
import { onBeforeMount } from 'vue';

import { createRoomContext, provideRoomContext } from '../composables/useRoomContext';
import RoomCard from './RoomCard.vue';

const props = defineProps<{
	roomId: string;
}>();

const context = createRoomContext();

context.roomId = props.roomId;

provideRoomContext(context);

onBeforeMount(() => {
	context.room.disconnect();
});
</script>

<template>
	<RoomCard />
	<slot />
</template>
