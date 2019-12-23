# @megazazik/validate

[![npm version](https://badge.fury.io/js/%40megazazik%2Fvalidate.svg)](https://badge.fury.io/js/%40megazazik%2Fvalidate)

Library to validate values via simple functions.

## Validate object fields

`init` function creates a validation scheme. And then you can set validation rules via `rules` method. You should set rules for properties of object. In this example rules for the `value` property are set.

```js
import { init } from "@megazazik/validate";

// this scheme validates objects of shape {value: string}
const myScheme = init().rules({
  value: {
    required: str => !str,
    minLenght: str => (str.length <= 8 ? { length: str.length } : false)
  }
});
```

Each rule should return `false`, `undefined` or `null` if data is correct. If data has errors a rule should return `true` or any other value with meta of error.

A scheme has the `validate` method. It returns `null` if data is correct or an object with errors.

```js
myScheme.validate({ value: "" });
// {value: {errors: [{type: 'required'}]}}

myScheme.validate({ value: "123" });
// {value: {errors: [{type: 'minLenght', error: {length: 3}]}}}

myScheme.validate({ value: "123456789" });
// null
```

## Nested schemes

Validation schemes can be nested.

```js
import { init } from "@megazazik/validate";

const childScheme = init().rules({
  value: {
    required: str => !str,
    minLenght: str => str.length <= 8
  }
});

const parentScheme = init().rules({
  child: childScheme
});

parentScheme.validate({ child: { value: "" } });
// {child: {value: {errors: [{type: 'required'}]}}}
```

## Rules for a whole object

You can also use `rules` method if you need to validate some primitive value or a whole object.

A primitive value example.

```js
import { init } from "@megazazik/validate";

const myStringScheme = init().rules({
  required: str => !str,
  minLenght: str => str.length <= 8
});

myStringScheme.validate("");
// {errors: [{type: 'required'}]}

myStringScheme.validate("123");
// {errors: [{type: 'minLenght'}]}

myStringScheme.validate("123456789");
// null
```

A whole object rules example.

```js
import { init } from "@megazazik/validate";

// this scheme validates objects which look like {value: ''}
const myObjectScheme = init().rules({
  value: {
    required: str => !str,
    minLenght: str => str.length <= 8
  },
  // in this case the valueRequired rule duplicates the 'require' rule from of 'value' property
  valueRequired: obj => !obj.value
});

const result = myObjectScheme.validate({ value: "" });
// errors of whole object rules is an array
console.log(result.errors[0]); // {type: 'valueRequired'}
// errors of property rules can be accessed via properties
console.log(result.value.errors); // [ {type: 'required'} ]

// if object has no own errors then the length of result array is 0
const result2 = myObjectScheme.validate({ value: "123" });
console.log(result2.errors.length); // 0
// and errors of property rules can be still accessed via properties
console.log(result2.value.errors); // [ {type: 'minLenght', error: {length: 3} ]

// if object has no own errors, no property errors then the result of validation is null
myObjectScheme.validate({ value: "123456789" });
// null
```

## Validate array of values

If you have an object with a dynamic array of values you can validate them via the `list` function.

```js
import { init, list } from "@megazazik/validate";

const myStringScheme = init().rules({
  required: str => !str,
  minLenght: str => (str.length <= 8 ? { length: str.length } : false)
});

const myObjectScheme = init().rules({
  // this rule validates an array of strings
  values: list(stringScheme)
});

const errors = myObjectScheme.validate({
  values: ["", "sdfsdf", "123123123"]
});

console.log(errors.values);
// [
//   {errors: [{ type: "required" }]},
//   {errors: [{ type: "minLenght" }]},
//   null
// ]
```

## Validate map of values

If you have an object with a dynamic map of values you can validate them via the `map` function.

```js
import { init, map } from "@megazazik/validate";

const myStringScheme = init().rules({
  required: str => !str,
  minLenght: str => (str.length <= 8 ? { length: str.length } : false)
});

const myObjectScheme = init().rules({
  // this rule validates an array of strings
  values: map(stringScheme)
});

const errors = myObjectScheme.validate({
  values: { v1: "", v2: "sdfsdf", v3: "123123123" }
});

console.log(errors.values);
// {
//   v1: {errors: [{ type: "required" }]},
//   v2: {errors: [{ type: "minLenght" }]}
// }
```

## Errors of all rules instead of first error

By default the `validate` function returns the first error for each property and the first error of a whole object errors. In this example the `minLenght` rule will not be checked if the `required` rule returns `true`.

```js
import { init } from "@megazazik/validate";

const myScheme = init().rules({
  value: {
    required: str => !str,
    minLenght: str => str.length <= 8
  }
});
```

If you need to receive all errors of scheme you can use the `allOf` function. Then all rules will be checked and all errors will be returned.

```js
import { init, allOf } from "@megazazik/validate";

const myScheme = init().rules({
  value: {
    ...allOf({
      required: str => !str,
      minLenght: str => str.length <= 8
    })
  }
});
```
