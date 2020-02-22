import test from 'tape';
import { spy } from 'sinon';
import { init, allOf, list, map } from '..';

test('meta. own rule', t => {
	const rule = spy((value: string, meta: any) => !value);

	const scheme = init<string, number>().rules({
		required: rule
	});

	t.deepEqual(scheme.validate('', 10).errors, [{ type: 'required' }]);

	t.equal(rule.args[0][0], '');
	t.equal(rule.args[0][1], 10);

	t.deepEqual(scheme.validate('12', 11), null);

	t.end();
});

test('meta. field rules', t => {
	const rule = spy(
		(
			value: string,
			meta: { data: { value: string }; meta: number; fieldName: 'value' }
		) => !value
	);

	const scheme = init<{ value: string }, number>().rules({
		value: {
			required: rule
		}
	});

	const value = { value: '' };

	t.deepEqual(scheme.validate(value, 10).value.errors, [
		{ type: 'required' }
	]);

	t.equal(rule.args[0][0], value.value);
	t.equal(rule.args[0][1].data, value);
	t.equal(rule.args[0][1].fieldName, 'value');
	t.equal(rule.args[0][1].meta, 10);

	t.deepEqual(scheme.validate({ value: '12' }, 10), null);

	t.end();
});

test('meta. nested scheme', t => {
	const required = spy((v: string, meta: any) => !v);
	const stringScheme = init<string, { fieldName: string }>().rules({
		required
	});

	const scheme = init<{ value: string }, number>().rules({
		value: stringScheme
	});

	const value = { value: '' };
	t.deepEqual(scheme.validate(value, 15).value.errors, [
		{ type: 'required' }
	]);
	t.equal(required.args[0][0], value.value);
	t.equal(required.args[0][1].data, value);
	t.equal(required.args[0][1].fieldName, 'value');
	t.equal(required.args[0][1].meta, 15);

	t.deepEqual(scheme.validate({ value: '12' }, 10), null);

	t.end();
});

test('meta. nested scheme. without meta', t => {
	const required = spy((v: string, meta: any) => !v);
	const stringScheme = init<string, { fieldName: string }>().rules({
		required
	});

	const scheme = init<{ value: string }>().rules({
		value: stringScheme
	});

	const value = { value: '' };
	scheme.validate(value);

	t.equal(required.args[0][0], value.value);
	t.equal(required.args[0][1].data, value);
	t.equal(required.args[0][1].fieldName, 'value');
	t.equal(required.args[0][1].meta, undefined);

	t.deepEqual(scheme.validate({ value: '12' }, 10), null);

	t.end();
});

test('meta. nested scheme. own implementation', t => {
	const required = spy((v: string, meta: any) => !v);

	const scheme = init<{ value: string }, number>().rules({
		value: { validate: required }
	});

	const value = { value: '' };
	t.deepEqual(scheme.validate(value, 15).value, true);
	t.equal(required.args[0][0], value.value);
	t.equal(required.args[0][1].data, value);
	t.equal(required.args[0][1].fieldName, 'value');
	t.equal(required.args[0][1].meta, 15);

	t.deepEqual(scheme.validate({ value: '12' }, 10), null);

	t.end();
});

test('meta. allof. own rules', t => {
	const rule1 = spy((...args) => false);
	const rule2 = spy((...args) => false);

	const scheme = init<string, number>().rules(
		allOf({
			rule1,
			rule2,
			rule3: (v: string, d: number) => false
		})
	);

	scheme.validate('123', 43);

	t.equal(rule1.args[0][0], '123');
	t.equal(rule1.args[0][1], 43);

	t.equal(rule2.args[0][0], '123');
	t.equal(rule2.args[0][1], 43);

	t.end();
});

test('meta. allof. field rules', t => {
	const rule1 = spy((...args) => false);
	const rule2 = spy((...args) => false);

	const scheme = init<{ value: string }, number>().rules({
		value: allOf({
			rule1,
			rule2,
			rule3: (v, d) => false
		})
	});

	const value = { value: '' };
	scheme.validate(value, 10);

	t.equal(rule1.args[0][0], value.value);
	t.equal(rule1.args[0][1].data, value);
	t.equal(rule1.args[0][1].fieldName, 'value');
	t.equal(rule1.args[0][1].meta, 10);

	t.equal(rule2.args[0][0], value.value);
	t.equal(rule2.args[0][1].data, value);
	t.equal(rule2.args[0][1].fieldName, 'value');
	t.equal(rule2.args[0][1].meta, 10);

	t.end();
});

test('meta. list', t => {
	const scheme = {
		validate: spy((data: string, meta: any) => false)
	};

	const data = ['', 'sdfsdf', '123123123'];
	list(scheme).validate(data, 20);

	t.equal(scheme.validate.args[0][0], '');
	t.equal(scheme.validate.args[0][1].meta, 20);
	t.equal(scheme.validate.args[0][1].index, 0);
	t.equal(scheme.validate.args[0][1].data, data);

	t.equal(scheme.validate.args[1][0], 'sdfsdf');
	t.equal(scheme.validate.args[1][1].meta, 20);
	t.equal(scheme.validate.args[1][1].index, 1);
	t.equal(scheme.validate.args[1][1].data, data);

	t.equal(scheme.validate.args[2][0], '123123123');
	t.equal(scheme.validate.args[2][1].meta, 20);
	t.equal(scheme.validate.args[2][1].index, 2);
	t.equal(scheme.validate.args[2][1].data, data);

	t.end();
});

test('meta. map', t => {
	const scheme = {
		validate: spy((data: string, meta: any) => false)
	};

	const data = { p1: '', p2: 'sdfsdf', p3: '123123123' };
	map(scheme).validate(data, 20);

	t.equal(scheme.validate.args[0][0], '');
	t.equal(scheme.validate.args[0][1].meta, 20);
	t.equal(scheme.validate.args[0][1].fieldName, 'p1');
	t.equal(scheme.validate.args[0][1].data, data);

	t.equal(scheme.validate.args[1][0], 'sdfsdf');
	t.equal(scheme.validate.args[1][1].meta, 20);
	t.equal(scheme.validate.args[1][1].fieldName, 'p2');
	t.equal(scheme.validate.args[1][1].data, data);

	t.equal(scheme.validate.args[2][0], '123123123');
	t.equal(scheme.validate.args[2][1].meta, 20);
	t.equal(scheme.validate.args[2][1].fieldName, 'p3');
	t.equal(scheme.validate.args[2][1].data, data);

	t.end();
});
