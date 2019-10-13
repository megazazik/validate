import test from "tape";
import { init, allOf, list, map } from "..";

const required = <V = any>(data: V) => !data;

test("validate. simple value", t => {
  const scheme = init<string>().rules({
    required,
    minLenght: v => v.length <= 8
  });

  t.deepEqual(scheme.validate(""), [{ type: "required" }]);
  t.deepEqual(scheme.validate("sdfsf"), [{ type: "minLenght" }]);
  t.equal(scheme.validate("sdfsfsfsdfsdf"), null);

  t.end();
});

test("validate. nested value", t => {
  type T = { value: string };

  const stringScheme = init<string>().rules({
    required,
    minLenght: v => v.length <= 8
  });

  const scheme = init<T>().children({
    value: stringScheme
  });

  t.deepEqual(
    scheme.validate({ value: "wer" }).length,
    0,
    "Should have length property as an array"
  );

  t.deepEqual(scheme.validate({ value: "" }), {
    value: [{ type: "required" }]
  });

  t.deepEqual(scheme.validate({ value: "sdfsf" }), {
    value: [{ type: "minLenght" }]
  });

  t.deepEqual(scheme.validate({ value: "sdfsfsfsdfsdf" }), null);

  t.end();
});

test("validate. nested value with own props", t => {
  type T = { value: string };

  const stringScheme = init<string>().rules({
    required,
    minLenght: v => v.length <= 8
  });

  const scheme = init<T>()
    .children({
      value: stringScheme
    })
    .rules({
      valueRequired: v => !v.value,
      valueMinLength: v => v.value.length <= 6
    });

  t.deepEqual(scheme.validate({ value: "" }), {
    value: [{ type: "required" }],
    [0]: { type: "valueRequired" }
  });

  t.deepEqual(
    scheme.validate({
      value: "sdfs"
    }),
    {
      value: [{ type: "minLenght" }],
      [0]: { type: "valueMinLength" }
    }
  );

  t.strictEqual(
    scheme.validate({
      value: "sdfsfsfsdfsdf"
    }),
    null
  );

  t.end();
});

test("validate. not boolean result", t => {
  type T = { value: string };

  const stringScheme = init<string>().rules({
    required: v => (v ? null : { text: "empty" }),
    minLenght: v => (v.length <= 8 ? "myerror" : null)
  });

  const scheme = init<T>()
    .children({
      value: stringScheme
    })
    .rules({
      valueRequired: v => (!v.value ? "valueRequired" : false),
      valueMinLength: v => v.value.length <= 6
    });

  t.deepEqual(scheme.validate({ value: "" }), {
    value: [{ type: "required", error: { text: "empty" } }],
    [0]: { type: "valueRequired", error: "valueRequired" }
  });

  t.deepEqual(
    scheme.validate({
      value: "sdfs"
    }),
    {
      value: [{ type: "minLenght", error: "myerror" }],
      [0]: { type: "valueMinLength" }
    }
  );

  t.strictEqual(
    scheme.validate({
      value: "sdfsfsfsdfsdf"
    }),
    null
  );

  t.end();
});

test("validate. all rules of list", t => {
  const scheme = init<string>().rules({
    required,
    ...allOf({
      minLenght: v => v.length <= 8,
      contains4: v => !v.includes("4")
    })
  });

  t.deepEqual(scheme.validate(""), [{ type: "required" }]);
  t.deepEqual(scheme.validate("sdfsf"), [
    { type: "minLenght" },
    { type: "contains4" }
  ]);
  t.deepEqual(scheme.validate("sdfsfsfsdfsdf"), [{ type: "contains4" }]);
  t.deepEqual(scheme.validate("sdfsfsf4sdfsdf"), null);

  t.end();
});

test("validate. list of values", t => {
  type T = { value: string[] };

  const stringScheme = init<string>().rules({
    required: v => !v,
    minLenght: v => v.length <= 8
  });

  const scheme = init<T>().children({
    value: list(stringScheme)
  });

  const validationResult = scheme.validate({
    value: ["", "sdfsdf", "123123123"]
  });
  t.equal(validationResult.length, 0);
  t.deepEqual(validationResult.value, [
    [{ type: "required" }],
    [{ type: "minLenght" }],
    null
  ]);

  t.deepEqual(
    scheme.validate({ value: ["qweasdzxc", "321311231", "123123123"] }),
    null
  );

  t.end();
});

test("validate. map of values", t => {
  type T = { value: { [name: string]: string } };

  const stringScheme = init<string>().rules({
    required: v => !v,
    minLenght: v => v.length <= 8
  });

  const scheme = init<T>().children({
    value: map(stringScheme)
  });

  const validationResult = scheme.validate({
    value: { v1: "", v2: "sdfsdf", v3: "123123123" }
  });
  t.equal(validationResult.length, 0);
  t.deepEqual(validationResult.value, {
    v1: [{ type: "required" }],
    v2: [{ type: "minLenght" }],
    v3: null
  });

  t.deepEqual(
    scheme.validate({
      value: { v1: "qweasdzxc", v2: "321311231", v3: "123123123" }
    }),
    null
  );

  t.end();
});
