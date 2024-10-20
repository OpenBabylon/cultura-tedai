import { RoomEvent } from 'livekit-client';

import { catchError } from '@cultura-ai/shared';

import { onRoomEvent } from './onRoomEvent';

const decoder = new TextDecoder();

export function onRoomDataCommand(cmdName: string, fn: (msg: Record<string, any>) => void) {
	onRoomEvent(RoomEvent.DataReceived, (payload) => {
		const [_, msg] = catchError(() => {
			return JSON.parse(decoder.decode(payload)) as Record<string, any>;
		});

		if (msg?.cmd !== cmdName) return;
		console.info('DataReceived', { cmdName, msg });
		fn(msg);
	});
}
