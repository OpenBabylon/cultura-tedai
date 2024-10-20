<script lang="ts" setup>
import { useRoute } from 'vue-router';

import { Room } from '@/modules/room';

definePage({
	meta: {
		layout: 'LayoutDefaultCenter',
	},
});

const roomId = useRoute('/rooms.[room_id]').params.room_id;
</script>

<template>
	<Room :room-id="roomId" />
</template>
