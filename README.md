# @megazazik/validate

![npm](https://img.shields.io/npm/v/@megazazik/validate)

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

Each rule should return `false` if data is correct. If data has errors a rule should return `true` or any truthy value with meta of error.

A scheme has the `validate` method. It returns `null` if data is correct or an object with errors.

```js
myScheme.validate({ value: "" });
// {value: [{type: 'required'}]}

myScheme.validate({ value: "123" });
// {value: [{type: 'minLenght', error: {length: 3}]}

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
// {child: {value: [{type: 'required'}]}
```

## Validate full object

`rules` method set rules for properties of object. If you need to validate interaction of several properties or some primitive value you can use `fullObjectRules`.

A primitive value example.

```js
import { init } from "@megazazik/validate";

const myStringScheme = init().fullObjectRules({
  required: str => !str,
  minLenght: str => str.length <= 8
});

myStringScheme.validate("");
// [{type: 'required'}]

myStringScheme.validate("123");
// [{type: 'minLenght'}]

myStringScheme.validate("123456789");
// null
```

Object rules with property rules example.

```js
import { init } from "@megazazik/validate";

// this scheme validates objects which look like {value: ''}
const myObjectScheme = init()
  .rules({
    value: {
      required: str => !str,
      minLenght: str => str.length <= 8
    }
  })
  .fullObjectRules({
    // in this case the valueRequired rule duplicates the 'require' rule from of 'value' property
    valueRequired: obj => !obj.value
  });

const errors = myObjectScheme.validate({ value: "" });
// errors of full object rules is an array
console.log(errors[0]); // {type: 'valueRequired'}
// errors of property rules can be accessed via properties
console.log(errors.value); // [ {type: 'required'} ]

// if object has no own errors then the length of result array is 0
const errors2 = myObjectScheme.validate({ value: "123" });
console.log(errors.length); // 0
// and errors of property rules can be still accessed via properties
console.log(errors.value); // [ {type: 'minLenght', error: {length: 3} ]

// if object has no own errors, no property errors then the result of validation is null
myObjectScheme.validate({ value: "123456789" });
// null
```

## Validate array of values

If you have an object with a dynamic array of values you can validate them via the `list` function.

```js
import { init, list } from "@megazazik/validate";

const myStringScheme = init().fullObjectRules({
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
//   [{ type: "required" }],
//   [{ type: "minLenght" }],
//   null
// ]
```

## Validate map of values

If you have an object with a dynamic map of values you can validate them via the `map` function.

```js
import { init, map } from "@megazazik/validate";

const myStringScheme = init().fullObjectRules({
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
//   v1: [{ type: "required" }],
//   v2: [{ type: "minLenght" }]
// }
```

## Errors of all rules instead of first error

By default the `validate` function returns the first error for each property and the first error of full object errors. In this example the `minLenght` rule will not be checked if the `required` rule returns `true`.

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
