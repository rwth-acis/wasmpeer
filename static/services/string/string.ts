import { JSON } from 'assemblyscript-json';

export function concat(input: string): string {
	const raw = <JSON.Obj>JSON.parse(input);

	const first = (<JSON.Str>raw.getString('first')).toString();
	const second = (<JSON.Str>raw.getString('second')).toString();

	return first + second;
}
