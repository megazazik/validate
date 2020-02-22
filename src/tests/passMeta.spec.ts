import test from 'tape';
import { spy } from 'sinon';
import { passMeta } from '..';

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

	t.end();
});
