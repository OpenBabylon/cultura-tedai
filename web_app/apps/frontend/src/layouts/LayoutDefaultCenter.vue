<script lang="ts" setup></script>

<template>
	<div class="h-dvh flex flex-col p-4 flex-grow items-center justify-center">
		<router-view v-slot="{ Component, route }">
			<Suspense>
				<component :is="Component" :key="route" />
			</Suspense>
		</router-view>
	</div>
</template>
