import { type LocalAudioTrack, type LocalVideoTrack, RoomEvent } from 'livekit-client';
import { type MaybeRefOrGetter, customRef, toValue, watch } from 'vue';

import { noop } from '@cultura-ai/shared';

import { onRoomEvent } from './onRoomEvent';
import { useMediaDevices } from './useMediaDevices';
import { useRoomContext } from './useRoomContext';

export interface UseMediaDeviceSelectOptions {
	kind: MaybeRefOrGetter<MediaDeviceKind>;
	track?: MaybeRefOrGetter<LocalAudioTrack | LocalVideoTrack | undefined>;
	/**
	 * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
	 * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
	 * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
	 * appropriate permissions.
	 *
	 * @see {@link MediaDeviceMenu}
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
	 */
	requestPermissions?: boolean;
	/**
	 * this callback gets called if an error is thrown when failing to select a device and also if a user
	 * denied permissions, eventhough the `requestPermissions` option is set to `true`.
	 * Most commonly this will emit a MediaDeviceError
	 */
	onError?: (e: Error) => void;
}

export function useMediaDeviceSelect({
	kind,
	onError,
	requestPermissions,
	track,
}: UseMediaDeviceSelectOptions) {
	const devices = useMediaDevices(kind, requestPermissions);
	const deviceId = createDeviceSelectorRef(kind, track, { exact: false, onError });

	return { devices, deviceId };
}

export type SetMediaDeviceOptions = {
	/**
	 *  If true, adds an `exact` constraint to the getUserMedia request.
	 *  The request will fail if this option is true and the device specified is not actually available
	 */
	exact?: boolean;
	onError?: (e: Error) => void;
};

export function createDeviceSelectorRef(
	kindRef: MaybeRefOrGetter<MediaDeviceKind>,
	localTrackRef?: MaybeRefOrGetter<LocalAudioTrack | LocalVideoTrack | undefined>,
	{ exact, onError }: SetMediaDeviceOptions = {},
) {
	const { room } = useRoomContext();

	let _track = noop;
	let _trigger = noop;
	let currentDeviceId: string | undefined;

	const handleError = (err: unknown) => {
		if (err instanceof Error && onError) {
			onError(err);
		} else {
			console.error(err);
		}
	};

	const updateCurrentDeviceId = async (
		kind: MediaDeviceKind,
		localTrack?: LocalAudioTrack | LocalVideoTrack,
	) => {
		let oldDeviceId = currentDeviceId;

		try {
			if (localTrack) {
				currentDeviceId = await localTrack.getDeviceId();
			} else {
				currentDeviceId = room.getActiveDevice(kind);
			}

			if (oldDeviceId !== currentDeviceId) {
				_trigger();
			}
		} catch (err) {
			handleError(err);
		}
	};

	watch(
		[() => toValue(kindRef), () => toValue(localTrackRef)],
		([kind, localTrack]) => updateCurrentDeviceId(kind, localTrack),
		{ immediate: true },
	);

	onRoomEvent(RoomEvent.ActiveDeviceChanged, (_kind) => {
		if (kindRef !== _kind) return;
		_trigger();
	});

	const setActiveMediaDevice = async (id: string) => {
		try {
			const kind = toValue(kindRef);
			const localTrack = toValue(localTrackRef);

			if (localTrack) {
				await localTrack.setDeviceId(exact ? { exact: id } : id);
			} else {
				await room.switchActiveDevice(kind, id, exact);
			}

			await updateCurrentDeviceId(kind, localTrack);

			if (currentDeviceId !== id && id !== 'default') {
				console.warn(
					`We tried to select the device with id (${id}), but the browser decided to select the device with id (${currentDeviceId}) instead.`,
				);
			}
		} catch (err) {
			handleError(err);
		}
	};

	const deviceId = customRef<string | undefined>((track, trigger) => {
		_track = track;
		_trigger = trigger;

		return {
			get: () => {
				_track();
				return currentDeviceId;
			},
			set: (value) => setActiveMediaDevice(value!),
		};
	});

	return deviceId;
}
