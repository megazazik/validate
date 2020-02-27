import test from 'tape';
import { spy } from 'sinon';
import { passMeta } from '..';

/** @todo удалить? */
test('meta. own rule', t => {
	const scheme = {
		validate: spy((value: string, meta: any) => !value)
	};

	passMeta('meta1', scheme).validate('myData', { meta1: 123 });

	t.equal(scheme.validate.args[0][0], 'myData');
	t.equal(scheme.validate.args[0][1], 123);

	passMeta('meta2', scheme).validate('myData2', { meta2: false });

	t.equal(scheme.validate.args[1][0], 'myData2');
	t.equal(scheme.validate.args[1][1], false);

	passMeta((m: number) => m * 2, scheme).validate('myData3', 312);

	t.equal(scheme.validate.args[2][0], 'myData3');
	t.equal(scheme.validate.args[2][1], 624);

	t.end();
});
