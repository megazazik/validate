import { expectType, expectError } from 'tsd';
import { init } from '..';

/** Simple value */
expectType<Readonly<{
	errors: Array<
		| {
				type: 'required';
		  }
		| {
				type: 'maxLength';
		  }
		| {
				type: 'noType';
		  }
	>;
	required?: boolean;
	maxLength?: boolean;
	noType?: boolean;
}> | null>(
	init<string>()
		.rules({
			required: () => false,
			maxLength: (v: string) => !!v,
			noType: v => !!v
		})
		.validate('')
);

/** Simple value with meta */
expectType<Readonly<{
	errors: Array<
		| {
				type: 'required';
		  }
		| {
				type: 'maxLength';
		  }
		| {
				type: 'noType';
		  }
	>;
	required?: boolean;
	maxLength?: boolean;
	noType?: boolean;
}> | null>(
	init<string, number>()
		.rules({
			required: () => false,
			maxLength: (v: string, n: number) => !!v,
			noType: (v, n) => !!v
		})
		.validate('', 12)
);

/** Simple value - rules return data */
expectType<Readonly<{
	errors: Array<
		| {
				type: 'required';
				error: number;
		  }
		| {
				type: 'maxLength';
				error: string;
		  }
		| {
				type: 'noType';
				error: { data: number };
		  }
	>;
	required?: number;
	maxLength?: string;
	noType?: { data: number };
}> | null>(
	init<string>()
		.rules({
			required: () => 11,
			maxLength: (v: string) => 'sdf',
			noType: v => ({ data: 1 })
		})
		.validate('')
);

/** object */
expectType<Readonly<{
	errors: never[];
	value?: Readonly<{
		errors: Array<
			| {
					type: 'required';
					error: string;
			  }
			| {
					type: 'maxLength';
			  }
			| {
					type: 'noType';
			  }
			| {
					type: 'maxLengthFull';
			  }
			| {
					type: 'maxLengthFull2';
			  }
		>;
		required?: string;
		maxLength?: boolean;
		noType?: boolean;
		maxLengthFull?: boolean;
		maxLengthFull2?: boolean;
	}> | null;
}> | null>(
	init<{ value: string }, { value: number }>()
		.rules({
			value: {
				required: () => '',
				maxLength: (v: string) => !!v,
				noType: v => !!v,
				maxLengthFull: (
					v: string,
					obj?: {
						data: { value: string };
						meta: { value: number };
						fieldName: 'value';
					}
				) => !!v,
				maxLengthFull2: (v, { data, meta, fieldName }) => !!v
			}
		})
		.validate({ value: '' }, { value: 21 })
);

/** nested schemes */
expectType<Readonly<{
	errors: never[];
	value?: Readonly<{
		errors: Array<
			| {
					type: 'required';
					error: string;
			  }
			| {
					type: 'maxLength';
			  }
			| {
					type: 'noType';
			  }
		>;
		required?: string;
		maxLength?: boolean;
		noType?: boolean;
	}> | null;
}> | null>(
	init<{ value: string }>()
		.rules({
			value: init<string>().rules({
				required: v => String(v),
				maxLength: (v: string) => !!v,
				noType: v => !!v
			})
		})
		.validate({ value: '' })
);

/** nested schemes - own realization scheme */
expectType<Readonly<{
	errors: never[];
	value?: { valueErrors: boolean };
}> | null>(
	init<{ value: string }>()
		.rules({
			value: { validate: () => ({ valueErrors: true }) }
		})
		.validate({ value: '' })
);

/** nested schemes - own realization scheme with full object */
expectType<Readonly<{
	errors: never[];
	value?: { valueErrors: boolean };
	value2?: { valueErrors: boolean };
}> | null>(
	init<{ value: string; value2: string }, number>()
		.rules({
			value: {
				validate: (
					v,
					obj: {
						meta: number;
						data: { value: string; value2: string };
						fieldName: 'value';
					}
				) => ({ valueErrors: true })
			},
			value2: { validate: (v, obj) => ({ valueErrors: true }) }
		})
		.validate({ value: '', value2: '' }, 1)
);

/** errors */
expectError(
	init<string>()
		.rules({ required: (v: number) => !!v })
		.validate('')
);

expectError(
	init<string>()
		.rules({ required: 'sdfsdf' })
		.validate('')
);

expectError(
	init<{ v: string }>()
		.rules({ v: () => true })
		.validate({ v: '' })
);

expectError(
	init<{ v: string }>()
		.rules({
			v: {
				req: (v: number) => false
			}
		})
		.validate({ v: '' })
);

expectError(
	init<{ value: string }, number>().validate({
		value: ''
	})
);

expectType<'Wrong type of rules. Check the following fields:' | 'd'>(
	init<{ v: string }>().rules({
		d: {
			req: (v: number) => false
		}
	})
);

/** @todo типы для list и map */
