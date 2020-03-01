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
	minLength: str => str.length <= 3
});

schema.validate('');
// {required: true}

schema.validate('12');
// {minLength: true}

schema.validate('1234');
// null
```

Each rule receives a value for validation and should return `false`, `undefined` or `null` if the value is correct. If the value has errors the rule should return `true` or any other value with meta data of error.

A schema has the `validate` method. It returns `null` if data is correct or an object with errors. Each error is placed in a separate field. Also you can get all errors as an array via `errors` getter of a result prototype.

```js
schema.validate('').errors;
// [ {type: 'required', data: true} ]

schema.validate('12').errors;
// [ {type: 'minLength', data: true} ]
```

### Error's metadata

If a rule returns any value which is considered an error, you can get this value in a validation result.

```js
const schema = init().rules({
	minLength: str => str.length <= 3 ? {length: str.length} : false;
});

schema.validate('12');
// {minLength: {length: 2}}

schema.validate('12').errors;
// [ {type: 'minLength', data: {length: 2}} ]
```

## Validate object fields

You can set separate rules for each field of on object. A schema in the next example validates values of the following interface

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
		minLength: str => str.length < 3
	}
});

userSchema.validate({ name: '' });
// { name: { required: true } }

userSchema.validate({ name: 'B' });
// { name: { minLength: true } }

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

Any object with the `validate` method can be passed as a field validation schema. These schemas can return any result. `false`, `null` or `undefined` means a data is valid. Any other value is considered an error.

```js
const nameSchema = {
	validate: (name: string) => (!!name ? false : 'My custom error')
};

const userSchema = init().rules({
	name: nameSchema
});

userSchema.validate({ name: '' });
// { name: 'My custom error' }

userSchema.validate({ name: 'Jon' });
// null
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

By default the `validate` function returns the first error for each property. In this example the `minLength` rule will not be checked if the `required` rule returns `true`.

```js
import { init } from '@megazazik/validate';

const mySchema = init().rules({
	value: {
		required: str => !str,
		minLength: str => str.length <= 8
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
			minLength: str => str.length <= 8
		})
	}
});

mySchema.validate('');
// {required: true, minLength: true}
```

## Meta info

Sometimes you need to get some additional information in your validation rules. You can pass this meta info to `validate` method as a second argument and get it inside rules.

### Meta info with simple value validation

In simple schemas you can get meta info as a second argument of rule.

<!-- @todo rewrite example -->

```ts
// in this example min-length is dynamic and is passed from outside
const passwordSchema = init<string, { minLength: number }>().rules({
	required: value => !value,
	minLength: (value, { minLength }) => value.length < minLength
});

passwordSchema.validate('somePassword', { minLength: 8 });
```

### Meta info with field values validation

Sometimes inside rules of object fields you may need to access the entire object and meta info. Because of this second argument of field rules is an object with the following fields:

-   _data_ - entire object
-   _meta_ - meta info passed to `validate` method
-   _fieldName_ - name of the current field

```ts
interface RegistrationData {
	username: string;
	password: string;
	passwordRepeat: string;
}

const schema = init<RegistrationData, { minLength: number }>().rules({
	username: {
		required: name => !name
	},
	password: {
		validate(password, { meta }) {
			// passwordSchema from the previous example
			return passwordSchema.validate(password, meta);
		}
	},
	passwordRepeat: {
		notEqual: (passwordRepeat, { data }) => passwordRepeat !== data.password
	}
});

schema.validate(
	{
		username: 'Jon',
		password: '12345',
		passwordRepeat: '1234'
	},
	{ minLength: 8 }
);
// {
//   password: {
//     minLength: true
//   },
//   passwordRepeat: {
//     notEqual: true
//   }
// }
```

## Extends schema

A schema object is immutable. Each time you call the `rules` method a new schema is created. You can add new rules to an existing schema.

```js
import { required, minLength } from './rules'; // some implementations of rules

const schema = init()
	.rules({ required })
	.rules({ minLength });
```

You can not extends an object's field rules by this way. The previous rules of the field will be overridden. If you want to do that you can use the second form of the `rules` method. It receive a function instead of an object. This function receive old rules of the schema and should return new ones. You don't need to return all old rules, only new ones. The old rules are the same values which are returned by `getRules` method of schema.

```js
import { required, minLength } from './rules'; // some implementations of rules

const userSchema = init().rules({
	name: {
		required
	},
	password: {
		required
	}
});

// ...

const extenedUserSchema = userSchema.rules(childRules => ({
	password: childRules.password.rules({
		minLength
	})
}));
```

### getRules

If you need to get all rules of some schema for any reasons you can use the `getRules` method. It returns an object with all rules and nested schemas which were defined previously.

```js
const schema = init().rules({
	someRule: v => {
		/* ... */
	},
	name: {
		required: v => !!v
	}
});

const oldRules = schema.getRules();
// {
//   someRule: <function>,
//   name: <child schema>
// }

// you can use them to create new schema
const newSchema = init().rules(
	// some improvements of rules
	modifyRules(oldRules)
);
```
