import EventEmitter from 'node:events';

import type uWS from '@cultura-ai/uws';

import { ProtoPeer } from './ProtoPeer';
import type { ProtoRpcRegister } from './ProtoRpcRegister';

export class ProtoRoom<TPeer extends ProtoPeer = ProtoPeer> extends EventEmitter {
	protected _peers: Map<string, TPeer> = new Map();
	protected _closed = false;

	constructor(private _rpcRegister: ProtoRpcRegister<TPeer['data']>) {
		super();
	}

	createPeer(peerId: string, socket: uWS.WebSocket<any>, data: TPeer['data']): TPeer {
		if (typeof peerId !== 'string' || !peerId) {
			socket.close();
			throw new TypeError('peerId must be a string');
		}

		if (this._peers.has(peerId)) {
			socket.close();
			throw new Error(`there is already a Peer with same peerId [peerId:"${peerId}"]`);
		}

		const peer = new ProtoPeer(peerId, socket, this._rpcRegister, data) as TPeer;

		this._registerPear(peer);

		return peer;
	}

	protected _registerPear(peer: TPeer): void {
		this._peers.set(peer.id, peer);

		peer.once('close', this._unregisterPeer.bind(this, peer));
	}

	protected _unregisterPeer(peer: ProtoPeer<any>): void {
		this._peers.delete(peer.id);

		if (!this._closed && !this._peers.size) {
			this.emit('empty');
		}
	}

	get peers(): IterableIterator<TPeer> {
		return this._peers.values();
	}

	get closed() {
		return this._closed;
	}

	async close() {
		if (this._closed) return;

		this._closed = true;

		// Close all Peers.
		for (const peer of this._peers.values()) {
			try {
				await peer.close();
			} catch (err) {
				this.onError(peer);
			}
		}

		this.emit('close');
	}

	hasPeer(peerId: string): boolean {
		return this._peers.has(peerId);
	}

	getPeer(peerId: string): TPeer | null {
		return this._peers.get(peerId) ?? null;
	}

	protected onError(err: unknown): void {
		this.emit('error', err);
	}
}
