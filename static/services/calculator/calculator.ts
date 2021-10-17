import { JSON } from 'assemblyscript-json';

export function add(input: string): i32 {
	const raw = <JSON.Obj>JSON.parse(input);

	const x = <i32>(<JSON.Integer>raw.getInteger('x'))._num;
	const y = <i32>(<JSON.Integer>raw.getInteger('y'))._num;

	return x + y;
}

export function subtract(input: string): i32 {

	const raw = <JSON.Obj>JSON.parse(input);

	const x = <i32>(<JSON.Integer>raw.getInteger('x'))._num;
	const y = <i32>(<JSON.Integer>raw.getInteger('y'))._num;

	return x - y;
}

export function multiple(input: string): i32 {

	const raw = <JSON.Obj>JSON.parse(input);

	const x = <i32>(<JSON.Integer>raw.getInteger('x'))._num;
	const y = <i32>(<JSON.Integer>raw.getInteger('y'))._num;

	return x * y;
}

export function divide(input: string): i32 {
	const raw = <JSON.Obj>JSON.parse(input);

	const x = <i32>(<JSON.Integer>raw.getInteger('x'))._num;
	const y = <i32>(<JSON.Integer>raw.getInteger('y'))._num;

	return x / y;
}

export function fib(input: string): i32 {
	const raw = <JSON.Obj>JSON.parse(input);
	const n = <i32>(<JSON.Integer>raw.getInteger('x'))._num;

	let i: i32, t: i32, a: i32 = 0, b: i32 = 1;
	for (i = 0; i < n; i++) {
		t = a + b; a = b; b = t;
	}
	return b;
}