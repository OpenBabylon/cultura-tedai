import { useLocalStorage } from '@vueuse/core';
import { Room, VideoPresets } from 'livekit-client';
import { type Reactive, type Ref, reactive, ref } from 'vue';

import { noop } from '@cultura-ai/shared';

import { createContext } from '@/composables/createContext';
import { useHTTP } from '@/composables/useHTTP';

export type ConnectionDetails = {
	serverUrl: string;
	roomId: string;
	participantToken: string;
	participantName: string;
};

export interface LocalUserChoices {
	/**
	 * Whether video input is enabled.
	 * @defaultValue `true`
	 */
	videoEnabled: boolean;
	/**
	 * Whether audio input is enabled.
	 * @defaultValue `true`
	 */
	audioEnabled: boolean;
	/**
	 * The device ID of the video input device to use.
	 * @defaultValue `''`
	 */
	videoDeviceId: string;
	/**
	 * The device ID of the audio input device to use.
	 * @defaultValue `''`
	 */
	audioDeviceId: string;
	/**
	 * The username to use.
	 * @defaultValue `''`
	 */
	username: string;

	/**
	 * The lang.
	 * @defaultValue `'en'`
	 */
	lang: string;
}

export interface RoomContext {
	room: Room;
	roomId: string;
	userChoices: Reactive<LocalUserChoices>;
	leaderId: Ref<string | null>;
	transcriptionAvailable: Ref<boolean>;
	join: () => void;
	joined: Ref<boolean>;
}

export const [injectRoomContext, provideRoomContext] = createContext<RoomContext>('RoomContext');

export function useRoomContext() {
	return injectRoomContext();
}

export function createRoomContext(): RoomContext {
	const http = useHTTP();

	const joined = ref(false);

	const leaderId = ref(null);

	const room = new Room({
		adaptiveStream: true,
		dynacast: true,
		videoCaptureDefaults: {
			resolution: VideoPresets.h720.resolution,
		},
	});

	const userChoices = reactive<LocalUserChoices>({
		username: useLocalStorage('meet.username', 'Andrew L.') as any,
		audioDeviceId: '',
		audioEnabled: true,
		videoDeviceId: '',
		videoEnabled: true,
		lang: useLocalStorage('meet.lang', 'en') as any,
	});

	const join = async () => {
		if (joined.value) return;

		joined.value = true;

		const {
			data: { participantToken, serverUrl },
		} = await http.post<{ data: ConnectionDetails }>('v1/room.getConnectionDetails', {
			roomId: context.roomId,
			participantName: context.userChoices.username,
			lang: context.userChoices.lang,
		});

		await room.connect(serverUrl, participantToken, { autoSubscribe: true }).catch(noop);
	};

	const context: RoomContext = {
		room,
		roomId: '',
		joined,
		userChoices,
		leaderId,
		transcriptionAvailable: ref(false),
		join,
	};

	// @ts-ignore
	window.room = context.room;

	return context;
}
