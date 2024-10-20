<script lang="ts" setup></script>

<template>
	<span>Layout test</span>
	<router-view v-slot="{ Component, route }">
		<transition name="slide">
			<component :is="Component" :key="route" />
		</transition>
	</router-view>
</template>
