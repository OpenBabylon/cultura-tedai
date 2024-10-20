<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';

defineProps<{
	to: RouteLocationRaw;
	text?: string;
}>();
</script>

<template>
	<RouterLink
		:to="to"
		activeClass="bg-gray-900"
		is="a"
		class="rounded-md px-3 py-2 text-sm font-medium text-white"
		aria-current="page"
	>
		<slot name="default">
			<span v-if="text">{{ text }}</span>
		</slot>
	</RouterLink>
</template>
