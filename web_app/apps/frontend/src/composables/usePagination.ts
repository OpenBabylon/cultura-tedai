import { logger } from '@cultura-ai/shared';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { reactive, ref, shallowRef, toValue, watch } from 'vue';

import { useDebounce } from './useDebounce';

interface FetchParams {
	page: number;
	limit: number;
	filter: object;
}

interface ProviderNativeResult<Item> {
	items: Array<Item>;
}

type ProviderPayloadResult<Item> = Array<Item>;

type ProviderResult<Item> = ProviderNativeResult<Item> | ProviderPayloadResult<Item>;

export type CallbackProvider<Item> = (
	params: FetchParams,
) => ProviderResult<Item> | Promise<ProviderResult<Item>>;

export type PaginationPageOptions<Item> = {
	perPage?: number;
	items?: Ref<Item[]>;
	filter?: MaybeRefOrGetter<Record<string, unknown>>;
	provider: CallbackProvider<Item>;
};

export interface UsePaginationState<T> {
	items: T[];
	refresh: () => void;
	reset: () => void;
	next: () => void;
	prev: () => void;
	isLoading: boolean;
	hasNext: boolean;
	hasPrev: boolean;
	currentPage: number;
}

const log = logger(import.meta.url);

export function usePagination<Item>(
	options: PaginationPageOptions<Item>,
): UsePaginationState<Item> {
	const { perPage = 10, provider } = options;

	const items = options.items || shallowRef([]);

	const isLoading = ref(false);

	const currentPage = ref(0);

	const hasNext = ref(false);

	const hasPrev = ref(false);

	const fetchPage = useDebounce(500, (pageNumber: number) => {
		const params: FetchParams = {
			page: pageNumber,
			limit: perPage,
			filter: toValue(options.filter) ?? {},
		};

		let pipePromise;

		const isFirstPage = pageNumber === 1;

		try {
			pipePromise = provider(params);

			if (!(pipePromise instanceof Promise)) {
				pipePromise = Promise.resolve(pipePromise);
			}
		} catch (err) {
			pipePromise = Promise.reject(err);
		}

		isLoading.value = true;

		pipePromise
			.then((result) => {
				let newItems: Array<Item> = [];

				if (Array.isArray(result)) {
					newItems = result;
				}

				if (Array.isArray((result as ProviderNativeResult<Item>)?.items)) {
					newItems = (result as ProviderNativeResult<Item>).items;
				}

				hasNext.value = newItems.length >= perPage;

				hasPrev.value = !isFirstPage;

				currentPage.value = pageNumber;

				items.value = newItems;
			})
			.catch((err) => {
				log.error(err);
			})
			.then(() => {
				isLoading.value = false;
			});
	});

	if (options.filter) {
		watch(
			options.filter,
			() => {
				fetchPage.schedule(1);
			},
			{ deep: true },
		);
	}

	const state: UsePaginationState<Item> = reactive({
		refresh,
		reset,
		next,
		prev,
		items,
		isLoading,
		hasNext,
		hasPrev,
		currentPage,
	});

	return state;

	function reset() {
		currentPage.value = 0;
		hasNext.value = false;
		hasPrev.value = false;
		isLoading.value = false;
	}

	function next() {
		if (!hasNext.value || isLoading.value) return;
		fetchPage.immediately(currentPage.value + 1);
	}

	function prev() {
		if (!hasPrev.value || isLoading.value) return;
		fetchPage.immediately(currentPage.value - 1);
	}

	function refresh() {
		reset();
		fetchPage.immediately(currentPage.value + 1);
	}
}
