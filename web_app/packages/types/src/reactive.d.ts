import type { Ref } from 'vue';

import { Fn } from './types';

export interface Pausable {
	/**
	 * A ref indicate whether a pausable instance is active
	 */
	isActive: Ref<boolean>;

	/**
	 * Temporary pause the effect from executing
	 */
	pause: Fn;

	/**
	 * Resume the effects
	 */
	resume: Fn;
}
