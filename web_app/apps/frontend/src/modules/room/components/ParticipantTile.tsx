import { Track } from 'livekit-client';
import type { FunctionalComponent } from 'vue';

import type { TrackReferenceOrPlaceholder } from '../composables/useTracks';
import AudioTrack from './AudioTrack.vue';
import VideoTrack from './VideoTrack.vue';

export interface ParticipantTileProps {
	track: TrackReferenceOrPlaceholder;
}

const ParticipantTile: FunctionalComponent<ParticipantTileProps> = ({ track }) => {
	if (
		track.publication?.kind === 'video' ||
		track.source === Track.Source.Camera ||
		track.source === Track.Source.ScreenShare
	) {
		return <VideoTrack track={track} />;
	}

	if (
		track.publication?.kind === 'audio' ||
		track.source === Track.Source.Microphone ||
		track.source === Track.Source.ScreenShareAudio
	) {
		return <AudioTrack track={track} />;
	}

	console.warn('Attempt to render unknown track: ' + track.participant?.kind);

	return null;
};

ParticipantTile.displayName = 'ParticipantTile';
ParticipantTile.props = ['track'];

export default ParticipantTile;
