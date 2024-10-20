import {
	type AudioCaptureOptions,
	ParticipantEvent,
	Room,
	type ScreenShareCaptureOptions,
	Track,
	type TrackPublishOptions,
	type VideoCaptureOptions,
} from 'livekit-client';
import { type Ref, customRef, ref, shallowRef, watch } from 'vue';

import { noop } from '@cultura-ai/shared';

import { onParticipantEvent } from './onParticipantEvent';
import { useRoomContext } from './useRoomContext';

export type ToggleSource = Exclude<
	Track.Source,
	Track.Source.ScreenShareAudio | Track.Source.Unknown
>;

export interface UseTrackToggleOptions<T extends ToggleSource> {
	source: T;
	captureOptions?: CaptureOptionsBySource<T>;
	publishOptions?: TrackPublishOptions;
	onChange?: (enabled: boolean) => void;
	onDeviceError?: (error: Error) => void;
}

export type CaptureOptionsBySource<T extends ToggleSource> = T extends Track.Source.Camera
	? VideoCaptureOptions
	: T extends Track.Source.Microphone
		? AudioCaptureOptions
		: T extends Track.Source.ScreenShare
			? ScreenShareCaptureOptions
			: never;

export function useTrackToggle<T extends ToggleSource>({
	source,
	captureOptions,
	publishOptions,
	onChange,
	onDeviceError,
}: UseTrackToggleOptions<T>) {
	const { room } = useRoomContext();

	const track = shallowRef(room.localParticipant.getTrackPublication(source));

	const { toggle, pending } = createMediaToggleRef(
		source,
		room,
		captureOptions,
		publishOptions,
		onDeviceError,
	);

	const enabled = ref(!!track.value?.isEnabled);

	watch(toggle, (isEnabled) => {
		track.value = room.localParticipant.getTrackPublication(source);
		enabled.value = !!track.value?.isEnabled;
		if (onChange) onChange(isEnabled);
	});

	return { enabled, toggle, pending, track };
}

export function createMediaToggleRef<T extends ToggleSource>(
	source: T,
	room: Room,
	options?: CaptureOptionsBySource<T>,
	publishOptions?: TrackPublishOptions,
	onError?: (error: Error) => void,
): { toggle: Ref<boolean>; pending: Ref<boolean> } {
	const { localParticipant } = room;

	const update = () => {
		_trigger();
	};

	const pending = ref(false);

	let _track = noop;
	let _trigger = noop;

	onParticipantEvent(localParticipant, ParticipantEvent.TrackMuted, update);
	onParticipantEvent(localParticipant, ParticipantEvent.TrackUnmuted, update);
	onParticipantEvent(localParticipant, ParticipantEvent.ParticipantPermissionsChanged, update);
	onParticipantEvent(localParticipant, ParticipantEvent.TrackPublished, update);
	onParticipantEvent(localParticipant, ParticipantEvent.TrackUnpublished, update);
	onParticipantEvent(localParticipant, ParticipantEvent.LocalTrackPublished, update);
	onParticipantEvent(localParticipant, ParticipantEvent.LocalTrackUnpublished, update);
	onParticipantEvent(localParticipant, ParticipantEvent.MediaDevicesError, update);
	onParticipantEvent(localParticipant, ParticipantEvent.TrackSubscriptionStatusChanged, update);

	const getSourceEnabled = () => {
		_track();

		switch (source) {
			case Track.Source.Camera:
				return localParticipant.isCameraEnabled;
			case Track.Source.Microphone:
				return localParticipant.isMicrophoneEnabled;
			case Track.Source.ScreenShare:
				return localParticipant.isScreenShareEnabled;
		}

		return false;
	};

	const setSourceEnabled = async (forceState?: boolean) => {
		pending.value = true;

		try {
			switch (source) {
				case Track.Source.Camera:
					await localParticipant.setCameraEnabled(
						forceState ?? !localParticipant.isCameraEnabled,
						options as VideoCaptureOptions,
						publishOptions,
					);
					break;
				case Track.Source.Microphone:
					await localParticipant.setMicrophoneEnabled(
						forceState ?? !localParticipant.isMicrophoneEnabled,
						options as AudioCaptureOptions,
						publishOptions,
					);
					break;
				case Track.Source.ScreenShare:
					await localParticipant.setScreenShareEnabled(
						forceState ?? !localParticipant.isScreenShareEnabled,
						options as ScreenShareCaptureOptions,
						publishOptions,
					);
					break;
				default:
					throw new TypeError('Tried to toggle unsupported source');
			}

			_trigger();
		} catch (e) {
			if (onError && e instanceof Error) {
				onError(e);
			} else {
				console.error(e);
			}
		} finally {
			pending.value = false;
		}
	};

	const toggle = customRef<boolean>((track, trigger) => {
		_track = track;
		_trigger = trigger;

		return {
			get: () => getSourceEnabled(),
			set: (value) => setSourceEnabled(value),
		};
	});

	return { pending, toggle };
}
