import { expectType, expectError, expectAssignable } from 'tsd';
import { init, PrimitiveScheme } from '..';

/** Simple value */
expectType<{
	required: () => boolean;
}>(
	init<string>()
		.rules({
			required: () => false
		})
		.getRules()
);

expectAssignable<{
	value: PrimitiveScheme<
		string,
		{
			required: (v: string) => string;
		},
		undefined
	>;
}>(
	init<{ value: string }, { value: number }>()
		.rules({
			value: {
				required: v => ''
			}
		})
		.getRules()
);

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
	> | null;
	required?: boolean;
	maxLength?: boolean;
}> | null>(
	init<string>()
		.rules({
			required: () => false
		})
		.rules({
			maxLength: (v: string) => !!v
		})
		.validate('')
);

/** object */
expectType<Readonly<{
	errors: Array<{
		type: 'required';
		data: string;
	}> | null;
	required?: string;
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
		>;
		required?: string;
		maxLength?: boolean;
	}> | null;
}> | null>(
	init<{ value: string }, { value: number }>()
		.rules({
			required: () => '',
			value: {
				required: (v, m) => ''
			}
		})
		.rules(rules => ({
			value: rules.value.rules({
				maxLength: (v, m: { meta: { value: number } }) => !!v
			})
		}))
		.validate({ value: '' }, { value: 21 })
);

expectError(
	init<{ value: string }, { value: number }>()
		.rules({
			required: () => '',
			value: {
				required: (v, m) => ''
			}
		})
		.rules(rules => ({
			value: rules.value.rules({
				maxLength: (v, m: { meta: { value: string } }) => !!v
			})
		}))
		.validate({ value: '' }, { value: 21 })
);

expectError(
	init<{ value: string }, { value: number }>()
		.rules({
			value: { validate: () => false }
		})
		.rules(({ value }) => ({
			value: value.rules({})
		}))
);
