import { expectType, expectError } from 'tsd';
import { init, CastSchemeMeta, Scheme, PrimitiveScheme } from '..';

/** Simple value */
expectType<Readonly<{
	errors: Array<
		| {
				type: 'required';
				data: boolean;
		  }
		| {
				type: 'maxLength';
				data: boolean;
		  }
		| {
				type: 'noType';
				data: boolean;
		  }
	> | null;
	required?: boolean;
	maxLength?: boolean;
	noType?: boolean;
}> | null>(
	init<string>()
		.rules({
			required: () => false,
			maxLength: (v: string) => !!v,
			noType: (v) => !!v,
		})
		.validate('')
);

/** Simple value with meta */
expectType<Readonly<{
	errors: Array<
		| {
				type: 'required';
				data: boolean;
		  }
		| {
				type: 'maxLength';
				data: boolean;
		  }
		| {
				type: 'noType';
				data: boolean;
		  }
	> | null;
	required?: boolean;
	maxLength?: boolean;
	noType?: boolean;
}> | null>(
	init<string, number>()
		.rules({
			required: () => false,
			maxLength: (v: string, n: number) => !!v,
			noType: (v, n) => !!v,
		})
		.validate('', 12)
);

/** Simple value - rules return data */
expectType<Readonly<{
	errors: Array<
		| {
				type: 'required';
				data: number;
		  }
		| {
				type: 'maxLength';
				data: string;
		  }
		| {
				type: 'noType';
				data: { data: number };
		  }
	> | null;
	required?: number;
	maxLength?: string;
	noType?: { data: number };
}> | null>(
	init<string>()
		.rules({
			required: () => 11,
			maxLength: (v: string) => 'sdf',
			noType: (v) => ({ data: 1 }),
		})
		.validate('')
);

/** object */
expectType<Readonly<{
	errors: never[] | null;
	value?: Readonly<{
		errors: Array<
			| {
					type: 'required';
					data: string;
			  }
			| {
					type: 'maxLength';
					data: boolean;
			  }
			| {
					type: 'noType';
					data: boolean;
			  }
			| {
					type: 'maxLengthFull';
					data: boolean;
			  }
			| {
					type: 'maxLengthFull2';
					data: boolean;
			  }
		> | null;
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
				noType: (v) => !!v,
				maxLengthFull: (
					v: string,
					obj?: {
						data: { value: string };
						meta: { value: number };
						fieldName: 'value';
					}
				) => !!v,
				maxLengthFull2: (v, { data, meta, fieldName }) => !!v,
			},
		})
		.validate({ value: '' }, { value: 21 })
);

/** nested schemes */
expectType<Readonly<{
	errors: never[] | null;
	value?: Readonly<{
		errors: Array<
			| {
					type: 'required';
					data: string;
			  }
			| {
					type: 'maxLength';
					data: boolean;
			  }
			| {
					type: 'noType';
					data: boolean;
			  }
		> | null;
		required?: string;
		maxLength?: boolean;
		noType?: boolean;
	}> | null;
}> | null>(
	init<{ value: string }>()
		.rules({
			value: init<string>().rules({
				required: (v) => String(v),
				maxLength: (v: string) => !!v,
				noType: (v) => !!v,
			}),
		})
		.validate({ value: '' })
);

/** nested schemes - own realization scheme */
expectType<Readonly<{
	errors: never[] | null;
	value?: { valueErrors: boolean };
}> | null>(
	init<{ value: string }>()
		.rules({
			value: { validate: () => ({ valueErrors: true }) },
		})
		.validate({ value: '' })
);

/** nested schemes - own realization scheme with full object */
expectType<Readonly<{
	errors: never[] | null;
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
				) => ({ valueErrors: true }),
			},
			value2: { validate: (v, obj) => ({ valueErrors: true }) },
		})
		.validate({ value: '', value2: '' }, 1)
);

/** errors */
expectError(
	init<string>()
		.rules({ required: (v: number) => !!v })
		.validate('')
);

expectError(init<string>().rules({ required: 'sdfsdf' }).validate(''));

/** @todo исправить и убрать комментарий - здесь должна быть ошибка */
// export function wrontParam() {
// 	const scheme = init<{ v: string }>();
// 	expectError(scheme.rules({ v: () => true }));
// }

expectError(
	init<{ v: string }>()
		.rules({
			v: {
				req: (v: number) => false,
			},
		})
		.validate({ v: '' })
);

expectError(
	init<{ value: string }, number>().validate({
		value: '',
	})
);

expectType<'Wrong type of rules. Check the following fields:' | 'd'>(
	init<{ v: string }>().rules({
		d: {
			req: (v: number) => false,
		},
	})
);

expectType<PrimitiveScheme<string, {}, { m1: string; m2: number }>>(
	null as unknown as CastSchemeMeta<
		PrimitiveScheme<string, {}, { m1: string }>,
		{ m1: string; m2: number }
	>
);

expectType<'New meta type should extend old one'>(
	null as unknown as CastSchemeMeta<
		PrimitiveScheme<string, {}, { m1: string }>,
		{ m2: number }
	>
);

expectType<Scheme<{}, {}, {}, { m1: string; m2: number }>>(
	null as unknown as CastSchemeMeta<
		Scheme<{}, {}, {}, { m1: string }>,
		{ m1: string; m2: number }
	>
);

expectType<'New meta type should extend old one'>(
	null as unknown as CastSchemeMeta<
		Scheme<{}, {}, {}, { m1: string }>,
		{ m2: number }
	>
);
