import { type RpcContext, RpcRegister } from '@cultura-ai/proto';

import type { ProtoPeer } from './ProtoPeer';

export type ProtoRpcContext<TPeer extends ProtoPeer<any> = ProtoPeer> = RpcContext<{
	peer: TPeer;
}>;

export class ProtoRpcRegister<TPeer extends ProtoPeer<any> = ProtoPeer> extends RpcRegister<
	ProtoRpcContext<TPeer>
> {}
