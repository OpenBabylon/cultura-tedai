import { createSharedComposable } from '@vueuse/core';
import {
	LocalTrackPublication,
	Participant,
	RemoteTrackPublication,
	Room,
	RoomEvent,
	Track,
	TrackPublication,
} from 'livekit-client';
import {
	type ComputedRef,
	type MaybeRefOrGetter,
	type ShallowRef,
	computed,
	markRaw,
	shallowRef,
	toValue,
} from 'vue';

import { onRoomEvent } from './onRoomEvent';
import { useRoomContext } from './useRoomContext';

export type UseTracksOptions = {
	updateOnlyOn?: RoomEvent[];
	onlySubscribed?: boolean;
	onlyLocal?: boolean;
};

export type TrackReference = {
	participant: Participant;
	publication: TrackPublication;
	source: Track.Source;
};

export type TrackReferencePlaceholder = {
	participant: Participant;
	publication?: never;
	source: Track.Source;
};

export type TrackSourceWithOptions = { source: Track.Source; withPlaceholder: boolean };

export type SourcesArray = Track.Source[] | TrackSourceWithOptions[];

export type TrackReferenceOrPlaceholder = TrackReference | TrackReferencePlaceholder;

export type UseTracksHookReturnType<T> = T extends Track.Source[]
	? ShallowRef<TrackReference[]>
	: T extends TrackSourceWithOptions[]
		? ShallowRef<TrackReferenceOrPlaceholder[]>
		: never;

export const allRemoteParticipantRoomEvents = [
	RoomEvent.ConnectionStateChanged,
	RoomEvent.RoomMetadataChanged,

	RoomEvent.ActiveSpeakersChanged,
	RoomEvent.ConnectionQualityChanged,

	RoomEvent.ParticipantConnected,
	RoomEvent.ParticipantDisconnected,
	RoomEvent.ParticipantPermissionsChanged,
	RoomEvent.ParticipantMetadataChanged,
	RoomEvent.ParticipantNameChanged,
	RoomEvent.ParticipantAttributesChanged,

	RoomEvent.TrackMuted,
	RoomEvent.TrackUnmuted,
	RoomEvent.TrackPublished,
	RoomEvent.TrackUnpublished,
	RoomEvent.TrackStreamStateChanged,
	RoomEvent.TrackSubscriptionFailed,
	RoomEvent.TrackSubscriptionPermissionChanged,
	RoomEvent.TrackSubscriptionStatusChanged,
];

export const allParticipantRoomEvents = [
	...allRemoteParticipantRoomEvents,
	RoomEvent.LocalTrackPublished,
	RoomEvent.LocalTrackUnpublished,
];

export function useParticipantTrack(
	source: Track.Source,
	participantId: MaybeRefOrGetter<string>,
): ComputedRef<TrackReferenceOrPlaceholder | undefined> {
	const allTracks = useAllTracks();

	return computed(() => {
		const id = toValue(participantId);

		return allTracks.value.find((v) => v.participant.identity === id && v.source === source);
	});
}

export const useAllTracks = createSharedComposable(() => {
	return useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.Microphone, withPlaceholder: false },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
			{ source: Track.Source.ScreenShareAudio, withPlaceholder: false },
		],
		{
			onlySubscribed: false,
			onlyLocal: false,
			updateOnlyOn: [RoomEvent.ActiveSpeakersChanged],
		},
	);
});

export function useTracks<T extends SourcesArray = Track.Source[]>(
	sources: T = [
		Track.Source.Camera,
		Track.Source.Microphone,
		Track.Source.ScreenShare,
		Track.Source.ScreenShareAudio,
		Track.Source.Unknown,
	] as T,
	options: UseTracksOptions = {},
): UseTracksHookReturnType<T> {
	const { room } = useRoomContext();

	const tracks = shallowRef([] as any) as UseTracksHookReturnType<T>;

	const sourceNames = sources.map((s) => (isSourceWitOptions(s) ? s.source : s));

	const additionalRoomEvents = options.updateOnlyOn ?? allParticipantRoomEvents;

	const onlySubscribedTracks: boolean = options.onlySubscribed ?? true;

	const onlyLocalTracks = options.onlyLocal ?? false;

	const update = () => {
		const { participants, trackReferences } = getTrackReferences(
			room,
			sourceNames,
			onlySubscribedTracks,
			onlyLocalTracks,
		);

		if (isSourcesWithOptions(sources)) {
			const requirePlaceholder = requiredPlaceholders(sources, participants);
			const trackReferencesWithPlaceholders: TrackReferenceOrPlaceholder[] =
				Array.from(trackReferences);

			participants.forEach((participant) => {
				if (requirePlaceholder.has(participant.identity)) {
					const sourcesToAddPlaceholder = requirePlaceholder.get(participant.identity) ?? [];
					sourcesToAddPlaceholder.forEach((placeholderSource) => {
						if (
							trackReferences.find(
								({ participant: p, publication }) =>
									participant.identity === p.identity && publication.source === placeholderSource,
							)
						) {
							return;
						}
						const placeholder: TrackReferencePlaceholder = {
							participant,
							source: placeholderSource,
						};
						trackReferencesWithPlaceholders.push(placeholder);
					});
				}
			});

			tracks.value = trackReferencesWithPlaceholders.map(markRaw);
		} else {
			tracks.value = trackReferences.map(markRaw);
		}
	};

	onRoomEvent(
		[
			RoomEvent.ParticipantConnected,
			RoomEvent.ParticipantDisconnected,
			RoomEvent.ConnectionStateChanged,
			RoomEvent.LocalTrackPublished,
			RoomEvent.LocalTrackUnpublished,
			RoomEvent.TrackPublished,
			RoomEvent.TrackUnpublished,
			RoomEvent.TrackSubscriptionStatusChanged,
			...additionalRoomEvents,
		],
		update,
	);

	update();

	return tracks;
}

export function isSourceWitOptions(source: SourcesArray[number]): source is TrackSourceWithOptions {
	return typeof source === 'object';
}

function getTrackReferences(
	room: Room,
	sources: Track.Source[],
	onlySubscribedTracks = true,
	onlyLocalTracks = false,
): { trackReferences: TrackReference[]; participants: Participant[] } {
	const trackReferences: TrackReference[] = [];
	const participants = onlyLocalTracks
		? [room.localParticipant]
		: Array.from(room.remoteParticipants.values());

	for (const participant of participants) {
		for (const source of sources) {
			const sourceReferences = Array.from<RemoteTrackPublication | LocalTrackPublication>(
				participant.trackPublications.values(),
			)
				.filter(
					(track) =>
						track.source === source &&
						// either return all or only the ones that are subscribed
						(!onlySubscribedTracks || track.track),
				)
				.map((track): TrackReference => {
					return {
						participant: participant,
						publication: track,
						source: track.source,
					};
				});

			trackReferences.push(...sourceReferences);
		}
	}

	return { trackReferences, participants };
}

export function isSourcesWithOptions(sources: SourcesArray): sources is TrackSourceWithOptions[] {
	return (
		Array.isArray(sources) &&
		(sources as TrackSourceWithOptions[]).filter(isSourceWitOptions).length > 0
	);
}

export function requiredPlaceholders<T extends SourcesArray>(
	sources: T,
	participants: Participant[],
): Map<Participant['identity'], Track.Source[]> {
	const placeholderMap = new Map<Participant['identity'], Track.Source[]>();
	if (isSourcesWithOptions(sources)) {
		const sourcesThatNeedPlaceholder = sources
			.filter((sourceWithOption) => sourceWithOption.withPlaceholder)
			.map((sourceWithOption) => sourceWithOption.source);

		participants.forEach((participant) => {
			const sourcesOfSubscribedTracks = participant
				.getTrackPublications()
				.map((pub) => pub.track?.source)
				.filter((trackSource): trackSource is Track.Source => trackSource !== undefined);
			const placeholderNeededForThisParticipant = Array.from(
				difference(new Set(sourcesThatNeedPlaceholder), new Set(sourcesOfSubscribedTracks)),
			);
			// If the participant needs placeholder add it to the placeholder map.
			if (placeholderNeededForThisParticipant.length > 0) {
				placeholderMap.set(participant.identity, placeholderNeededForThisParticipant);
			}
		});
	}
	return placeholderMap;
}

function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _difference = new Set(setA);
	for (const elem of setB) {
		_difference.delete(elem);
	}
	return _difference;
}
