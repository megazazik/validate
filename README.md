# @megazazik/validate

![npm](https://img.shields.io/npm/v/@megazazik/validate)

Library to validate values via simple functions.

## Validate simple value

`init` function creates a validation scheme. And then you set validation rules via `rules` function.

```js
import { init } from "@megazazik/validate";

const myStringScheme = init().rules({
  required: str => !str,
  minLenght: str => (str.length <= 8 ? { length: str.length } : false)
});
```

Each rule should return `false` if data is correct. If data has errors rule should return `true` or some value which will be added to an error object.

A scheme has the `validate` method. It returns `null` if data is correct or an array of errors.

```js
myStringScheme.validate("");
// [{type: 'required'}]

myStringScheme.validate("123");
// [{type: 'minLenght', error: {length: 3}]

myStringScheme.validate("123456789");
// null
```

## Nested schemes

Validation scheme can be nested.

```js
import { init } from "@megazazik/validate";

const myStringScheme = init().rules({
  required: str => !str,
  minLenght: str => (str.length <= 8 ? { length: str.length } : false)
});

// this scheme validate objects which look like {value: ''}
const myObjectScheme = init()
  .children({
    value: myStringScheme
  })
  .rules({
    // in this case the valueRequired rule duplicates the 'require' rule from myStringScheme
    valueRequired: obj => !obj.value
  });

const errors = myObjectScheme.validate({ value: "" });
// errors of own rules is an array still
console.log(errors[0]); // {type: 'valueRequired'}
// errors of nested rules can be accessed via properties
console.log(errors.value); // [ {type: 'required'} ]

// if object has no own errors then the length of result array is 0
const errors2 = myObjectScheme.validate({ value: "123" });
console.log(errors.length); // 0
// and errors of nested rules can be still accessed via properties
console.log(errors.value); // [ {type: 'minLenght', error: {length: 3} ]

// if object has no own errors, no nested errors then the result of validation is null
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

const myObjectScheme = init().children({
  // this rule validates an array of strings
  values: list(stringScheme)
});

const errors = myObjectScheme.validate({
  values: ["", "sdfsdf", "123123123"]
});

console.log(errors.values);
// [
//   [{ type: "required" }],
//   [{ type: "minLenght" }],
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

const myObjectScheme = init().children({
  // this rule validates an array of strings
  values: map(stringScheme)
});

const errors = myObjectScheme.validate({
  values: { v1: "", v2: "sdfsdf", v3: "123123123" }
});

console.log(errors.values);
// {
//   v1: [{ type: "required" }],
//   v2: [{ type: "minLenght" }]
// }
```

## Errors of all rules

By default the `validate` function returns the first error of scheme rules. In this example the `minLenght` rule will not be checked if the `required` rule returns `true`.

```js
import { init } from "@megazazik/validate";

const myStringScheme = init().rules({
  required: str => !str,
  minLenght: str => (str.length <= 8 ? { length: str.length } : false)
});
```

If you need to receive all errors of scheme you can use the `allOf` function. Then all rules will be checked and all errors will be returned.

```js
import { init, allOf } from "@megazazik/validate";

const myStringScheme = init().rules({
  ...allOf({
    required: str => !str,
    minLenght: str => (str.length <= 8 ? { length: str.length } : false)
  }
});
```
