import { isObject, omit } from '@cultura-ai/shared';

export type TraceId = string | number;

export type ActorId = string | object | null;

export type ActorType = 'user' | 'service' | 'unknown';

export type ActionProducer<T extends object = Record<string, any>> = {
	_id: ActorId;
	type: ActorType;
	ipAddress?: string;
} & T;

export interface EventActionParams<T extends object = Record<string, any>> {
	traceId?: TraceId;
	actionProducer?: ActionProducer<T>;
}

export interface ServiceActorParams<T extends object = Record<string, any>> {
	traceId?: TraceId;
	actorId?: ActorId;
	actorType?: ActorType;
	actorRoles?: string[];
	ipAddress?: string;
	organizationId?: string;
	extraParams?: T;
}

export class ServiceActor<T extends object = Record<string, any>> {
	private _traceId: TraceId;
	private _actorId: ActorId;
	private _actorType: ActorType;
	private _actorRoles: string[];
	private _ipAddress?: string;
	private _organizationId?: string;
	private _extraParams: T;

	constructor(params?: ServiceActorParams<T>) {
		this._traceId = Date.now().toString() + '-' + Math.ceil(Math.random() * 100000000000000);

		this._actorId = null;
		this._actorType = 'unknown';
		this._actorRoles = [];
		this._extraParams = {} as T;

		if (isObject(params)) {
			this.assign(params);
		}
	}

	get traceId(): TraceId {
		return this._traceId;
	}

	get actorId(): ActorId {
		return this._actorId;
	}

	get actorType(): ActorType {
		return this._actorType;
	}

	get actorRoles(): string[] {
		return [...this._actorRoles];
	}

	get ipAddress(): string | undefined {
		return this._ipAddress;
	}

	get organizationId(): string | null {
		return this._organizationId || null;
	}

	get extraParams(): T {
		return { ...this._extraParams };
	}

	getExtra<Key extends keyof T>(key: Key): T[Key] {
		return this._extraParams[key];
	}

	setExtra<Key extends keyof T>(key: Key, value: T[Key]) {
		this._extraParams[key] = value;
	}

	assign(params: ServiceActorParams<T>) {
		this._traceId = params?.traceId ?? this._traceId;
		this._actorId = params.actorId ?? this._actorId;
		this._actorType = params?.actorType ?? this._actorType;
		this._actorRoles = params?.actorRoles ?? this._actorRoles;
		this._organizationId = params?.organizationId ?? this._organizationId;
		this._ipAddress = params?.ipAddress ?? this._ipAddress;

		if (isObject(params?.extraParams)) {
			Object.assign(this._extraParams, params.extraParams);
		}

		return this;
	}

	assignFromEvent(params: EventActionParams<T>) {
		this._traceId = params.traceId ?? this._traceId;
		this._actorId = params.actionProducer?._id ?? this._actorId;
		this._actorType = params.actionProducer?.type ?? this._actorType;
		this._ipAddress = params.actionProducer?.ipAddress ?? this._ipAddress;

		const extraParams = omit(params.actionProducer || {}, ['_id', 'type', 'ipAddress']) as T;

		Object.assign(this._extraParams, extraParams);

		return this;
	}

	retrieve(): EventActionParams<T> {
		return {
			traceId: this._traceId,
			actionProducer: {
				_id: this._actorId,
				type: this._actorType,
				ipAddress: this._ipAddress,
				...this._extraParams,
			},
		};
	}

	static Is(value: unknown): value is ServiceActor<Record<string, any>> {
		return value instanceof ServiceActor;
	}
}
