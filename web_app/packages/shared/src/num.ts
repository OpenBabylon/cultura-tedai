/**
 * Round a number to digits
 */
export function round2digits(value: number, digits: number = 2) {
	if (digits === 0) {
		return value << 0;
	}

	// @ts-ignore
	return Number(Math.round(value + 'e' + digits) + 'e-' + digits);
}

/**
 * Get percent of value
 */
export function percentOf(value: number, percent: number, digits?: number) {
	let result = (percent / 100) * value;

	if (digits) {
		result = round2digits(result, digits);
	}

	return result;
}

/**
 * Humanize a big number like 100K 1.2M
 */
export function humanize(input: number | string, decimals = 1): string {
	if (input === null || input === undefined) {
		return String(input);
	}

	decimals = Math.max(decimals, 0);

	const number = parseInt(input as string, 10);

	if (!Number.isFinite(number)) {
		return String(input);
	}

	const signString = number < 0 ? '-' : '';
	const unsignedNumber = Math.abs(number);
	const unsignedNumberString = String(unsignedNumber);
	const numberLength = unsignedNumberString.length;
	const numberLengths = [13, 10, 7, 4];
	const bigNumPrefixes = ['T', 'B', 'M', 'k'];

	// small numbers
	if (unsignedNumber < 1000) {
		return `${signString}${unsignedNumberString}`;
	}

	// huge numbers
	if (numberLength > numberLengths[0] + 3) {
		return number.toExponential(decimals).replace('e+', 'x10^');
	}

	// 999 < unsignedNumber < 999,999,999,999,999
	let length = 0;
	for (let i = 0; i < numberLengths.length; i++) {
		const _length = numberLengths[i];
		if (numberLength >= _length) {
			length = _length;
			break;
		}
	}

	const decimalIndex = numberLength - length + 1;
	const unsignedNumberCharacterArray = unsignedNumberString.split('');

	const wholePartArray = unsignedNumberCharacterArray.slice(0, decimalIndex);
	const decimalPartArray = unsignedNumberCharacterArray.slice(
		decimalIndex,
		decimalIndex + decimals + 1,
	);

	const wholePart = wholePartArray.join('');

	// pad decimalPart if necessary
	let decimalPart = decimalPartArray.join('');
	if (decimalPart.length < decimals) {
		decimalPart += `${Array(decimals - decimalPart.length + 1).join('0')}`;
	}

	if (decimalPart[0] === '0') {
		decimals = 0;
	}

	let output;
	if (decimals === 0) {
		output = `${signString}${wholePart}${bigNumPrefixes[numberLengths.indexOf(length)]}`;
	} else {
		const outputNumber = Number(`${wholePart}.${decimalPart}`).toFixed(decimals);
		output = `${signString}${outputNumber}${bigNumPrefixes[numberLengths.indexOf(length)]}`;
	}

	return output;
}

export function formatNumber(value: number | string): string {
	if (!value || !value.toString) {
		return String(value);
	}

	const reg = /\B(?=(\d{3})+(?!\d))/g;
	return value.toString().replace(reg, ',');
}

export function formatMoney(
	amount: number,
	currencySymbol: string = 'USD',
	intMode = false,
): string {
	if (intMode) {
		amount = round2digits(amount / 100, 2);
	}

	return formatNumber(amount) + currencySymbol;
}

/**
 * This function make sorted series array from number[]
 *
 * For example: [1, 2, 3, 6, 7]
 *
 * Result: [[1, 3], [6, 7]]
 */
export function seriesList(list: Array<number>) {
	const result = [];
	list = [...list].sort();

	let sStart = list.shift() as number;
	let sEnd;

	while (list.length) {
		const value = list.shift() as number;

		if (!sEnd) {
			if (value - sStart > 1) {
				result.push([sStart], [value]);
				sStart = list.shift() as number;
			} else {
				sEnd = value;
			}
		} else {
			if (value - sEnd > 1) {
				result.push([sStart, sEnd]);

				sStart = value;
				sEnd = null;
			} else {
				sEnd = value;
			}
		}
	}

	if (sStart && sEnd) {
		result.push([sStart, sEnd]);
	} else {
		if (sStart) result.push([sStart]);
		if (sEnd) result.push([sEnd]);
	}

	return result;
}

export function range(min: number, max: number, value: number) {
	return Math.min(max, Math.max(min, value));
}

export const clamp = (num: number, min: number, max: number) => Math.min(max, Math.max(min, num));

export const sum = (values: number[]) => {
	return values.reduce((a, b) => a + b, 0);
};

export const avg = (values: number[]) => {
	if (values.length === 0) return 0;
	return sum(values) / values.length;
};
