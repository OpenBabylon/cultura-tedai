import { tryOnScopeDispose } from '@vueuse/core';
import { Room } from 'livekit-client';
import { type MaybeRefOrGetter, type ShallowRef, shallowRef, toValue, watch } from 'vue';

export function useMediaDevices(
	kindRef: MaybeRefOrGetter<MediaDeviceKind>,
	requestPermissions: boolean = true,
): ShallowRef<MediaDeviceInfo[]> {
	const devices = shallowRef<MediaDeviceInfo[]>([]);

	const update = async () => {
		const kind = toValue(kindRef);

		try {
			const newDevices = await Room.getLocalDevices(kind, requestPermissions);
			devices.value = newDevices;
		} catch (_) {}
	};

	navigator?.mediaDevices?.addEventListener('devicechange', update);

	tryOnScopeDispose(() => {
		navigator?.mediaDevices?.removeEventListener('devicechange', update);
	});

	watch(() => toValue(kindRef), update, { immediate: true });

	return devices;
}
