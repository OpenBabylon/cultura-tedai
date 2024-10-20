import { type Arrayable, tryOnScopeDispose } from '@vueuse/core';
import type { Room } from 'livekit-client';
import type { RoomEventCallbacks } from 'node_modules/livekit-client/dist/src/room/Room';

import { arrayable, uniq } from '@cultura-ai/shared';
import type { AnyFunction } from '@cultura-ai/types';

import { useRoomContext } from './useRoomContext';

type CancelCallback = () => void;

export function onRoomEvent<T extends keyof RoomEventCallbacks>(
	event: T,
	listener: RoomEventCallbacks[T],
): CancelCallback;

export function onRoomEvent<T extends keyof RoomEventCallbacks>(
	event: T[],
	listener: RoomEventCallbacks[T],
): CancelCallback;

// TODO: resolve any type when array of events passed

export function onRoomEvent(
	event: Arrayable<keyof RoomEventCallbacks>,
	listener: AnyFunction,
): () => void {
	const events = uniq(arrayable(event));
	const { room } = useRoomContext();

	const cancelFns: AnyFunction[] = [];

	for (const event of events) {
		cancelFns.push(addRoomEventListener(room, event, listener));
	}

	const cancel = () => {
		for (const fn of cancelFns) {
			fn();
		}

		cancelFns.length = 0;
	};

	tryOnScopeDispose(cancel);

	return cancel;
}

export function addRoomEventListener<T extends keyof RoomEventCallbacks>(
	room: Room,
	event: T,
	listener: RoomEventCallbacks[T],
): CancelCallback {
	room.on(event, listener);

	const cancel = () => {
		room.off(event, listener);
	};

	return cancel;
}
