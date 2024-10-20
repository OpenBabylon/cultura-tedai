import type {
	Component,
	ComponentOptions,
	DefineComponent,
	DefineSetupFnComponent,
	ExtractPropTypes,
	FunctionalComponent,
	SlotsType,
	VNode,
} from 'vue';
import type { JSX } from 'vue/jsx-runtime';

import type { CulturaAIOverwrites } from './models/overwrites';

export type DATE_ISO8601 = CulturaAIOverwrites.DATE_ISO8601;

export type ResourceId = CulturaAIOverwrites.ResourceId;

export type Fn = () => void;

export type Arrayable<T> = T[] | T;

export type Awaitable<T> = Promise<T> | T;

export type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;

export type FunctionArgs<Args extends any[] = any[], Return = void> = (...args: Args) => Return;

export type PromisifyFn<T extends AnyFunction> = (
	...args: ArgumentsType<T>
) => Promise<ReturnType<T>>;

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type AnyFunction = (...args: any[]) => any;

export type Data = Record<string, unknown>;

export type TimeObject = {
	h: number;
	m: number;
};

export interface ThemeConfig {
	colors: {
		[x: string]: Record<string, string>;
	};
	variables: {
		[x: string]: Record<string, string | number>;
	};
}

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type GenericObject = Record<string, any>;

export type ComponentProps<C extends Component> = C extends new (...args: any) => any
	? InstanceType<C>['$props']
	: C extends ComponentOptions
		? C['props'] extends object
			? ExtractPropTypes<C['props']>
			: C['$props']
		: C extends FunctionalComponent<infer X>
			? X
			: never;

export type ComponentSlots<C extends Component> =
	C extends DefineSetupFnComponent<any, any, infer S>
		? S extends SlotsType<infer X>
			? X
			: Record<string, any>
		: C extends DefineComponent<{}, {}, {}, {}, {}, {}, {}, {}, string, {}, {}, {}, infer X>
			? X
			: Record<string, any>;

export type UnwrapSlotsType<S extends SlotsType> = {
	[K in keyof S]: SlotWithJSX<S[K]>;
};

export type SlotWithJSX<T extends any = any> = (
	...args: IfAny<T, any[], [T] | (T extends undefined ? [] : never)>
) => JSX.Element | JSX.Element[] | VNode | VNode[] | null;

export interface SelectOptionItem<T = any> {
	text: string;
	value: T;
	props?: any;
}

export type SelectOptions<T = any> = SelectOptionItem<T>[];

export type OverwriteWith<T1, T2> = IsAny<T2> extends true ? T1 : Omit<T1, keyof T2> & T2;

export type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
