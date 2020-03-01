import test from 'tape';
import { init } from '..';

const required = <V = any>(data: V) => !data;

test('validate. getRules', t => {
	const rules = init<string>()
		.rules({ required })
		.getRules();

	t.deepEqual(Object.keys(rules), ['required']);
	t.equal(rules.required, required);

	const objectRules = init<{ value: string }>()
		.rules({
			value: { required },
			required,
			my: () => false
		})
		.getRules();

	t.deepEqual(Object.keys(objectRules), ['required', 'my', 'value']);
	t.deepEqual(
		objectRules.value.validate('', {
			data: { value: '' },
			fieldName: 'value',
			meta: undefined
		}),
		{ required: true }
	);
	t.deepEqual(
		objectRules.value.validate('123', {
			data: { value: '' },
			fieldName: 'value',
			meta: undefined
		}),
		null
	);
	t.equal(objectRules.required, required);

	const objectRules1 = init<{ value: string }>()
		.rules({
			value: init<string>().rules({ required }),
			required,
			my: () => false
		})
		.getRules();

	t.deepEqual(Object.keys(objectRules1), ['required', 'my', 'value']);
	t.deepEqual(objectRules1.value.validate(''), { required: true });
	t.deepEqual(objectRules1.value.validate('123'), null);
	t.equal(objectRules1.required, required);

	t.end();
});

test('validate. extend. simple', t => {
	const rules = init<string>()
		.rules({ required })
		.rules({
			min: v => v.length < 3
		});

	t.deepEqual(rules.validate(''), { required: true });
	t.deepEqual(rules.validate('1'), { min: true });
	t.deepEqual(rules.validate('12345'), null);

	t.end();
});

test('validate. extend. Child own scheme', t => {
	const rules = init<{ value: string }, { value: number }>()
		.rules({
			required,
			value: {
				required
			}
		})
		.rules(({ value }) => ({
			value: value.rules({
				min: (v, m) => {
					return v.length < 3 || !!m.meta;
				}
			})
		}));

	t.deepEqual(rules.validate(null, null), { required: true });
	t.deepEqual(rules.validate({ value: '' }, null), {
		value: { required: true }
	});
	t.deepEqual(rules.validate({ value: '1' }, null), { value: { min: true } });
	t.deepEqual(rules.validate({ value: '12345' }, null), null);
	t.deepEqual(rules.validate({ value: '12345' }, { value: 10 }), {
		value: { min: true }
	});

	t.end();
});

test('validate. extend. Child ext scheme', t => {
	const childRules = init<string, { meta: { value: number } }>().rules({
		required
	});

	const rules = init<{ value: string }, { value: number }>()
		.rules({
			required,
			value: childRules
		})
		.rules(({ value }) => ({
			value: value.rules({
				min: (v, m) => {
					return v.length < 3 || !!m.meta;
				}
			})
		}));

	t.deepEqual(rules.validate(null, null), { required: true });
	t.deepEqual(rules.validate({ value: '' }, null), {
		value: { required: true }
	});
	t.deepEqual(rules.validate({ value: '1' }, null), { value: { min: true } });
	t.deepEqual(rules.validate({ value: '12345' }, null), null);
	t.deepEqual(rules.validate({ value: '12345' }, { value: 10 }), {
		value: { min: true }
	});

	t.end();
});
