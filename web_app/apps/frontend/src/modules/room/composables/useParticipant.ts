import { type Participant, ParticipantEvent, Track, TrackPublication } from 'livekit-client';
import { type MaybeRefOrGetter, type Ref, type ShallowRef, ref, shallowRef, toValue } from 'vue';

import { onParticipantEvent } from './onParticipantEvent';

type UpdateFn<T extends Participant> = (participant: T) => void;

export type UseParticipantResult = {
	isMicrophoneEnabled: Ref<boolean>;
	isScreenShareEnabled: Ref<boolean>;
	isCameraEnabled: Ref<boolean>;
	microphoneTrack: ShallowRef<TrackPublication | undefined>;
	cameraTrack: ShallowRef<TrackPublication | undefined>;
};

export function useParticipant<T extends Participant>(
	participant: MaybeRefOrGetter<T>,
	updateFn?: UpdateFn<T>,
): UseParticipantResult {
	const isMicrophoneEnabled = ref(false);
	const isScreenShareEnabled = ref(false);
	const isCameraEnabled = ref(false);
	const microphoneTrack = shallowRef<TrackPublication | undefined>();
	const cameraTrack = shallowRef<TrackPublication | undefined>();

	const update = () => {
		const p = toValue(participant);

		isMicrophoneEnabled.value = p.isMicrophoneEnabled;
		isCameraEnabled.value = p.isCameraEnabled;
		isScreenShareEnabled.value = p.isScreenShareEnabled;

		microphoneTrack.value = !p.isMicrophoneEnabled
			? undefined
			: p.getTrackPublication(Track.Source.Microphone);

		cameraTrack.value = !p.isCameraEnabled ? undefined : p.getTrackPublication(Track.Source.Camera);

		updateFn?.(p);
	};

	update();

	onParticipantEvent(participant, ParticipantEvent.TrackMuted, update);
	onParticipantEvent(participant, ParticipantEvent.TrackUnmuted, update);
	onParticipantEvent(participant, ParticipantEvent.ParticipantPermissionsChanged, update);
	onParticipantEvent(participant, ParticipantEvent.TrackPublished, update);
	onParticipantEvent(participant, ParticipantEvent.TrackUnpublished, update);
	onParticipantEvent(participant, ParticipantEvent.LocalTrackPublished, update);
	onParticipantEvent(participant, ParticipantEvent.LocalTrackUnpublished, update);
	onParticipantEvent(participant, ParticipantEvent.MediaDevicesError, update);
	onParticipantEvent(participant, ParticipantEvent.TrackSubscriptionStatusChanged, update);

	return {
		isMicrophoneEnabled,
		isScreenShareEnabled,
		isCameraEnabled,
		microphoneTrack,
		cameraTrack,
	};
}
