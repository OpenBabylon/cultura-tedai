import { RoomEvent } from 'livekit-client';
import { ref } from 'vue';

import { onRoomDataCommand } from './onRoomDataCommand';
import { onRoomEvent } from './onRoomEvent';

export interface ChatItem {
	id: number;
	name: string;
	participantId: string;
	text: string;
}

let idSeq = 0;

export function useAssistantChat() {
	const items = ref<ChatItem[]>([]);

	onRoomDataCommand('chat_message', (msg) => {
		items.value.push({
			id: ++idSeq,
			name: msg.name,
			participantId: msg.pid,
			text: msg.text,
		});
	});

	onRoomEvent(RoomEvent.TranscriptionReceived, (payload, participant) => {
		if (!participant) return;

		const text = payload
			.map((v) => v.text)
			.join(' ')
			.trim();

		if (!text) return;

		const prevChatItem = items.value.at(-1);

		let chatItem: ChatItem;

		if (!prevChatItem || prevChatItem.participantId !== participant.identity) {
			chatItem = {
				id: ++idSeq,
				name: participant.name || participant.identity,
				participantId: participant.identity,
				text: '',
			};
			items.value.push(chatItem);
		} else {
			chatItem = prevChatItem;
		}

		chatItem.text += ' ' + text;
		chatItem.text = chatItem.text.trim();
	});

	return { items };
}
