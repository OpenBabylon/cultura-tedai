import { isString } from './is.js';

const DEF_STR_ASSIGN_REGEXP = /\{{([A-z-_. ]*)\}}/g;
const DEF_STR_ASSIGN_METHOD = (obj: any, key: string) => obj[key];

export function escapeHtml(unsafe: string) {
	if (typeof unsafe !== 'string') {
		return '';
	}

	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Escape string to regexp pattern
 */
export function escapeRegExp(str: string) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'); // eslint-disable-line
}

/**
 * A util function for assign string with object
 * @return {String}
 */
export function strAssign(str: string, obj: object, method = DEF_STR_ASSIGN_METHOD) {
	return str.replace(DEF_STR_ASSIGN_REGEXP, (match, p1) => {
		const key = p1.trim();
		const value = method(obj, key);

		if (value === undefined || value === null) {
			return match;
		}

		return value;
	});
}

export function escapeNumeric(str: string) {
	const result = String(str).replace(/\D/g, '');

	if (!result.length) {
		return undefined;
	}

	return result;
}

export function hasProtocol(url: string) {
	if (!isString(url)) return false;

	return url.startsWith('http://') || url.startsWith('https://');
}

export function convertToUnit(
	str: string | number | null | undefined,
	unit = 'px',
): string | undefined {
	if (str == null || str === '') {
		return undefined;
	} else if (isNaN(+str!)) {
		return String(str);
	} else {
		return `${Number(str)}${unit}`;
	}
}

export const capitalize = <T extends string>(str: T): Capitalize<T> => {
	return (str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()) as Capitalize<T>;
};

export const startCase = (value?: string): string => {
	return getWords(value).map(capitalize).join(' ');
};

/**
 * Converts a string to kebab case.
 *
 * Kebab case is the naming convention in which each word is written in lowercase and separated by a dash (-) character.
 *
 * @param {string} str - The string that is to be changed to kebab case.
 * @returns {string} - The converted string to kebab case.
 *
 * @example
 * const convertedStr1 = kebabCase('camelCase') // returns 'camel-case'
 * const convertedStr2 = kebabCase('some whitespace') // returns 'some-whitespace'
 * const convertedStr3 = kebabCase('hyphen-text') // returns 'hyphen-text'
 * const convertedStr4 = kebabCase('HTTPRequest') // returns 'http-request'
 */
export const kebabCase = (str?: string): string => {
	return getWords(str)
		.map((word) => word.toLowerCase())
		.join('-');
};

/**
 * Converts a string to camel case.
 *
 * camel case is the naming convention in which each word is written in lowercase and separated by an underscore (_) character.
 *
 * @param {string} str - The string that is to be changed to camel case.
 * @returns {string} - The converted string to camel case.
 *
 * @example
 * const convertedStr1 = camelCase('camelCase') // returns 'camelCase'
 * const convertedStr2 = camelCase('some whitespace') // returns 'someWhitespace'
 * const convertedStr3 = camelCase('hyphen-text') // returns 'hyphenText'
 * const convertedStr4 = camelCase('HTTPRequest') // returns 'httpRequest'
 */
export const camelCase = (str?: string): string => {
	const words = getWords(str);

	if (words.length === 0) {
		return '';
	}

	const [first, ...rest] = words;

	return `${first.toLowerCase()}${rest.map((word) => capitalize(word)).join('')}`;
};

export const upperCase = (value?: string): string => {
	return getWords(value)
		.map((v) => v.toUpperCase())
		.join(' ');
};

/**
 * Converts a string to lower case.
 *
 * Lower case is the naming convention in which each word is written in lowercase and separated by an space ( ) character.
 *
 * @param {string} str - The string that is to be changed to lower case.
 * @returns {string} - The converted string to lower case.
 *
 * @example
 * const convertedStr1 = lowerCase('camelCase') // returns 'camel case'
 * const convertedStr2 = lowerCase('some whitespace') // returns 'some whitespace'
 * const convertedStr3 = lowerCase('hyphen-text') // returns 'hyphen text'
 * const convertedStr4 = lowerCase('HTTPRequest') // returns 'http request'
 */
export const lowerCase = (str?: string): string => {
	return getWords(str)
		.map((word) => word.toLowerCase())
		.join(' ');
};

/**
 * Converts a string to snake case.
 *
 * Snake case is the naming convention in which each word is written in lowercase and separated by an underscore (_) character.
 *
 * @param {string} str - The string that is to be changed to snake case.
 * @returns {string} - The converted string to snake case.
 *
 * @example
 * const convertedStr1 = snakeCase('camelCase') // returns 'camel_case'
 * const convertedStr2 = snakeCase('some whitespace') // returns 'some_whitespace'
 * const convertedStr3 = snakeCase('hyphen-text') // returns 'hyphen_text'
 * const convertedStr4 = snakeCase('HTTPRequest') // returns 'http_request'
 */
export const snakeCase = (str?: string): string => {
	return getWords(str)
		.map((word) => word.toLowerCase())
		.join('_');
};

/**
 * Regular expression pattern to split strings into words for various case conversions
 *
 * This pattern matchs sequences of characters in a string, considering the following case:
 * - Sequences of two or more uppercase letters followed by an uppercase letter and lowercase letters or digits (for acronyms)
 * - Sequences of one uppercase letter optionally followed by lowercase letters and digits
 * - Single uppercase letters
 * - Sequences of digis
 *
 * The resulting match can be used to convert camelCase, snake_case, kebab-case, and other mixed formats into
 * a consistent format like snake case.
 *
 * @example
 * const matches = 'camelCaseHTTPRequest'.match(CASE_SPLIT_PATTERN);
 * // matchs: ['camel', 'Case', 'HTTP', 'Request']
 */
const CASE_SPLIT_PATTERN = /[A-Z]?[a-z]+|[0-9]+|[A-Z]+(?![a-z])/g;

export function getWords(str?: string): string[] {
	if (!isString(str)) return [];

	return Array.from(str.match(CASE_SPLIT_PATTERN) ?? []);
}

const rndCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
const charactersLength = rndCharacters.length;

export function randomString(length: number): string {
	let result = '';
	for (let i = 0; i < length; i++) {
		result += rndCharacters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
