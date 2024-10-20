<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { randomString } from '@cultura-ai/shared';

definePage({
	meta: {
		layout: 'LayoutDefaultCenter',
	},
});

const router = useRouter();

const startMeeting = () => {
	const roomId = randomString(8);
	router.push(`/rooms/${roomId}`);
};
</script>

<template>
	<Card class="min-w-96 overflow-hidden">
		<template #title>Cultura-AI</template>
		<template #content>Try for free with our live.</template>
		<template #footer>
			<div class="flex gap-4 mt-1">
				<Button label="Start Meeting" severity="contrast" class="w-full" @click="startMeeting" />
			</div>
		</template>
	</Card>
</template>
