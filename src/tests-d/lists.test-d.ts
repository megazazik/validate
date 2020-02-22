import { expectType, expectError } from 'tsd';
import { init, list, map } from '..';

expectType<Array<Readonly<{
	errors: Array<{ type: 'required' }>;
	required?: boolean;
}> | null> | null>(
	list(
		init<string>().rules({
			required() {
				return false;
			}
		})
	).validate([])
);

expectType<Array<Readonly<{
	errors: Array<{ type: 'required' }>;
	required?: boolean;
}> | null> | null>(
	list(
		init<string, { meta: string }>().rules({
			required() {
				return false;
			}
		})
	).validate([], 'sdf')
);

expectError(
	list(
		init<string, { meta: string }>().rules({
			required() {
				return false;
			}
		})
	).validate([], 123)
);

expectType<Record<
	string,
	Readonly<{
		errors: Array<{ type: 'required' }>;
		required?: boolean;
	}> | null
> | null>(
	map(
		init<string>().rules({
			required() {
				return false;
			}
		})
	).validate({})
);

expectType<Record<
	string,
	Readonly<{
		errors: Array<{ type: 'required' }>;
		required?: boolean;
	}> | null
> | null>(
	map(
		init<string, { meta: string }>().rules({
			required() {
				return false;
			}
		})
	).validate({}, 'sdf')
);

expectError(
	map(
		init<string, { meta: string }>().rules({
			required() {
				return false;
			}
		})
	).validate({}, 123)
);
