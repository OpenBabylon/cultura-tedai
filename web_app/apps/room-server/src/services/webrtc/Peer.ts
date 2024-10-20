import type * as mediasoup from 'mediasoup';

import type uWS from '@cultura-ai/uws';

import { ProtoPeer } from '../proto/ProtoPeer';
import type { ProtoRpcRegister } from '../proto/ProtoRpcRegister';
import type { Room } from './Room';

export interface PeerData {
	room: Room;
	joined: boolean;
	displayName?: string | undefined;
	device?: PeerDevice | undefined;
	rtpCapabilities?: mediasoup.types.RtpCapabilities | undefined;
	sctpCapabilities?: mediasoup.types.SctpCapabilities | undefined;
	transports: Map<string, mediasoup.types.WebRtcTransport | mediasoup.types.PlainTransport>;
	producers: Map<string, mediasoup.types.Producer>;
	consumers: Map<string, mediasoup.types.Consumer>;
	dataProducers: Map<string, mediasoup.types.DataProducer>;
	dataConsumers: Map<string, mediasoup.types.DataConsumer>;
	consume?: boolean;
}

export type PeerDevice = {
	flag: string;
	name: string;
	version?: string;
};

export class Peer extends ProtoPeer<PeerData> {
	constructor(id: string, socket: uWS.WebSocket<any>, rpcRegister: ProtoRpcRegister<Peer>) {
		super(id, socket, rpcRegister, {
			consume,
		});
	}

	get room(): Room {
		return this.data.room;
	}
}
