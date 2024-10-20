import { createLogger } from '@cultura-ai/logger';
import type { Logger } from '@cultura-ai/types';

import { type ProtoRpcContext, ProtoRpcRegister } from '../../proto/ProtoRpcRegister';
import type { PeerData } from '../Room';
import applyNetworkThrottle from './applyNetworkThrottle';
import changeDisplayName from './changeDisplayName';
import connectWebRtcTransport from './connectWebRtcTransport';
import createWebRtcTransport from './createWebRtcTransport';
import getConsumerStats from './getConsumerStats';
import getDataConsumerStats from './getDataConsumerStats';
import getDataProducerStats from './getDataProducerStats';
import getProducerStats from './getProducerStats';
import getRouterRtpCapabilities from './getRouterRtpCapabilities';
import getTransportStats from './getTransportStats';
import join from './join';
import pauseConsumer from './pauseConsumer';
import produce from './produce';
import requestConsumerKeyFrame from './requestConsumerKeyFrame';
import resetNetworkThrottle from './resetNetworkThrottle';
import restartIce from './restartIce';
import resumeConsumer from './resumeConsumer';

export type Handler = (
	this: RoomRpcRegister,
	ctx: ProtoRpcContext<PeerData>,
	...args: any[]
) => Awaited<unknown>;

export class RoomRpcRegister extends ProtoRpcRegister<PeerData> {
	log: Logger;

	constructor() {
		super();
		this._setupMethods();
		this.log = createLogger(import.meta);
	}

	pauseConsumer = pauseConsumer;
	requestConsumerKeyFrame = requestConsumerKeyFrame;
	resumeConsumer = resumeConsumer;
	getRouterRtpCapabilities = getRouterRtpCapabilities;
	join = join;
	createWebRtcTransport = createWebRtcTransport;
	connectWebRtcTransport = connectWebRtcTransport;
	restartIce = restartIce;
	produce = produce;
	changeDisplayName = changeDisplayName;
	getTransportStats = getTransportStats;
	getProducerStats = getProducerStats;
	getConsumerStats = getConsumerStats;
	getDataProducerStats = getDataProducerStats;
	getDataConsumerStats = getDataConsumerStats;
	applyNetworkThrottle = applyNetworkThrottle;
	resetNetworkThrottle = resetNetworkThrottle;
}
