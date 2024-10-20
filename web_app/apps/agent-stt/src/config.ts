import { env } from '@cultura-ai/shared';

export const LIVEKIT_URL = env.string('LIVEKIT_URL', 'wss://127.0.0.1');
export const LIVEKIT_API_KEY = env.string('LIVEKIT_API_KEY', 'devkey');
export const LIVEKIT_API_SECRET = env.string('LIVEKIT_API_SECRET', 'secret');
export const GROQ_API_KEY = env.string('GROQ_API_KEY');
