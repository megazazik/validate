# @megazazik/validate

[![npm version](https://badge.fury.io/js/%40megazazik%2Fvalidate.svg)](https://badge.fury.io/js/%40megazazik%2Fvalidate)

Library to validate values via simple functions.

## Main advantages

-   validation schemas are extendable and can be nested
-   the easiest way to create new rules or use existed validation functions
-   a validation result of each nested schemas is placed to a separate field of the full validation result so you can easy separate then in a view
-   a validation result is not responsible for errors representation. You can show them as you need, for example, in different languages or in a short and a long form for mobile and desktop view
-   the schema's `validate` method can receive some additional info for validation rules
-   schema and validation results are fully type checked with minimum efforts

## Schema initialization

`init` function creates a validation schema. And then you can set validation rules via `rules` method.

```js
import { init } from '@megazazik/validate';

const schema = init().rules({
	required: str => !str,
	minLenght: str => str.length <= 3
});

schema.validate('');
// {required: true}

schema.validate('12');
// {minLenght: true}

schema.validate('1234');
// null
```

Each rule receives a value for validation and should return `false`, `undefined` or `null` if the value is correct. If the value has errors the rule should return `true` or any other value with meta data of error.

A schema has the `validate` method. It returns `null` if data is correct or an object with errors. Each error is placed in a separate field. Also you can get all errors as an array via `errors` getter of a result prototype.

```js
schema.validate('').errors;
// [ {type: 'required', data: true} ]

schema.validate('12').errors;
// [ {type: 'minLenght', data: true} ]
```

### Error's metadata

If a rule returns any value which is considered an error, you can get this value in a validation result.

```js
const schema = init().rules({
	minLenght: str => str.length <= 3 ? {length: str.length} : false;
});

schema.validate('12');
// {minLenght: {length: 2}}

schema.validate('12').errors;
// [ {type: 'minLenght', data: {length: 2}} ]
```

## Validate object fields

You can set separate rules for each field of on object. A scheme in the next example validates values of the following interface

```ts
interface User {
	name: string;
}
```

You can set rules for the `name` field using the `rules` method.

```js
const userSchema = init().rules({
	name: {
		required: str => !str,
		minLenght: str => str.length < 3
	}
});

userSchema.validate({ name: '' });
// { name: { required: true } }

userSchema.validate({ name: 'B' });
// { name: { minLenght: true } }

userSchema.validate({ name: 'Bob' });
// null
```

The `errors` field of entire object validation result DOES NOT contain errors of nested fields. You can access them via nested fields of the result. If you want to check if an entire object validation result has any errors you can check if the result is null.

```js
const userSchema = init().rules({
	name: {
		required: str => !str
	}
});

const result = userSchema.validate({ name: '' });

result; // { name: { required: true } }
result.errors; // null
result.name; // { required: true }
result.name.errors; // [{ type: 'required', data: true }]
```

## Nested schemas

Validation schemas can be nested.

```js
const nameSchema = init().rules({
	required: str => !str
});

const userSchema = init().rules({
	name: nameSchema
});

userSchema.validate({ name: '' });
// { name: { required: true } }
```

## Validate an array of values

If you have an array of values you can create its validation schema via the `list` function.

```js
import { init, list } from '@megazazik/validate';

const nameSchema = init().rules({
	required: str => !str
});

listSchema = list(stringschema);
listSchema.validate(['', 'sdfsdf']);
// [
//   {required: true},
//   null
// ]
```

A result of list validation is `null` when all values of the list are valid.

```js
listSchema.validate(['sdf', 'sdfsdf']);
// null
```

You can add `listSchema` as a child schema to another schema.

```js
const parent = init().rules({
	values: listSchema
});
```

## Validate a map of values

If you have a dynamic map of values you can create its validation schema via the `map` function.

```js
import { init, map } from '@megazazik/validate';

const nameSchema = init().rules({
	required: str => !str
});

mapSchema = map(stringschema);
mapSchema.validate({ v1: '', v2: 'sdfsdf' });
// {
//   v1: {required: true},
//   v2: null
// }
```

A result of map validation is `null` when all values of the map are valid.

```js
mapSchema.validate({ v1: 'asd', v2: 'sdfsdf' });
// null
```

You can add `mapSchema` as a child schema to another schema.

```js
const parent = init().rules({
	values: mapSchema
});
```

## Errors of all rules instead of first error

By default the `validate` function returns the first error for each property. In this example the `minLenght` rule will not be checked if the `required` rule returns `true`.

```js
import { init } from '@megazazik/validate';

const mySchema = init().rules({
	value: {
		required: str => !str,
		minLenght: str => str.length <= 8
	}
});

mySchema.validate('');
// {required: true}
```

If you need to receive all errors of schema you can use the `allOf` function. Then all rules will be checked and all errors will be returned.

```js
import { init, allOf } from '@megazazik/validate';

const mySchema = init().rules({
	value: {
		...allOf({
			required: str => !str,
			minLenght: str => str.length <= 8
		})
	}
});

mySchema.validate('');
// {required: true, minLenght: true}
```
