<script lang="ts" setup></script>

<template>
	<div class="min-h-full h-full">
		<AppHeader />

		<div class="p-4 mx-auto max-w-7xl">
			<router-view v-slot="{ Component, route }">
				<transition name="slide">
					<component :is="Component" :key="route" />
				</transition>
			</router-view>
		</div>
	</div>
</template>
