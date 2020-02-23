const privates = new WeakMap();

export class Result {
	constructor(errors: Record<string, any>) {
		Object.assign(this, errors);

		const keys = Object.keys(errors);
		privates.set(
			this,
			keys.length === 0
				? null
				: keys.map(key => getError(key, errors[key]))
		);
	}

	public get errors() {
		return privates.get(this);
	}
}

function getError(key: string, result: any) {
	return result === true
		? { type: key }
		: {
				type: key,
				error: result
		  };
}

export function getErrors(result: any) {
	return privates.get(result);
}
