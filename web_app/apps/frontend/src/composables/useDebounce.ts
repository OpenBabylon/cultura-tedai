import { ref } from 'vue';

/**
 * Utility to scheduler or immediately invoke function
 */
export function useDebounce(delay: number, fn: Function) {
	let timer: number;

	const waiting = ref(false);
	const timeout = ref(false);

	return {
		waiting,
		timeout,
		reset,
		immediately,
		schedule,
	};

	function reset() {
		waiting.value = false;
		timeout.value = false;
		clearTimeout(timer);
	}

	function immediately(...args: any[]) {
		clearTimeout(timer);
		waiting.value = false;
		timeout.value = false;
		fn(...args);
	}

	function schedule(...args: any[]) {
		clearTimeout(timer);
		waiting.value = true;
		timer = window.setTimeout(() => {
			waiting.value = false;
			timeout.value = true;
			fn(...args);
		}, delay);
	}
}
