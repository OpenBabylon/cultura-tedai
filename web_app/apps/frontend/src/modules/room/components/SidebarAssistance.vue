<script lang="ts" setup>
import { type ChatItem, useAssistantChat } from '../composables/useAssistantChat';

const { items: chatItems } = useAssistantChat();

const getNameColor = (item: ChatItem) =>
	item.participantId === 'assistance' ? 'text-red-600' : 'text-blue-600';
</script>

<template>
	<div
		class="flex-shrink-0 overflow-hidden rounded-md w-80 bg-surface-0 text-surface-950 p-4 overflow-y-scroll"
	>
		<div class="text-2xl">Cultura AI assistance</div>

		<div section="assistant-chat" class="pt-4">
			<div
				section="assistant-chat-item"
				class="pb-2"
				v-for="item of chatItems"
				:key="'chat-item-' + item.id"
			>
				<div class="font-bold text-xs pb-1" :class="getNameColor(item)">{{ item.name }}</div>
				<span class="whitespace-pre-line text-sm" v-html="item.text" />
			</div>
		</div>
	</div>
</template>
