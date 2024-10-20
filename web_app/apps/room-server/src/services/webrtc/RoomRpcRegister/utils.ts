import { createRpcHandlerDefiner } from '@cultura-ai/proto';

import type { Handler } from '.';

export const defineHandler = createRpcHandlerDefiner<Handler>();
