import test from "tape";
import { init, allOf, list, map } from "..";

const required = <V = any>(data: V) => !data;

test("validate. simple value", t => {
  const scheme = init<string>().rules({
    required,
    minLenght: v => v.length <= 8
  });

  t.deepEqual(scheme.validate("")?.errors, [{ type: "required" }]);
  t.deepEqual(scheme.validate("sdfsf")?.errors, [{ type: "minLenght" }]);
  t.equal(scheme.validate("sdfsfsfsdfsdf"), null);

  t.end();
});

test("validate. nested rules via scheme", t => {
  type T = { value: string };

  const stringScheme = init<string>().rules({
    required,
    minLenght: v => v.length <= 8
  });

  const scheme = init<T>().rules({
    value: stringScheme
  });

  const result1 = scheme.validate({ value: "" });
  t.deepEqual(result1, {
    value: { errors: [{ type: "required" }] }
  });

  t.deepEqual(scheme.validate({ value: "sdfsf" }), {
    value: { errors: [{ type: "minLenght" }] }
  });

  t.deepEqual(scheme.validate({ value: "sdfsfsfsdfsdf" }), null);

  t.end();
});

test("validate. nested rules", t => {
  type T = { value: string };

  const scheme = init<T>().rules({
    value: {
      required,
      minLenght: v => v.length <= 8
    }
  });

  t.deepEqual(scheme.validate({ value: "" }), {
    value: { errors: [{ type: "required" }] }
  });

  const res = scheme.validate({ value: "sdfsf" });
  t.deepEqual(res, {
    value: { errors: [{ type: "minLenght" }] }
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

  const scheme = init<T>().rules({
    value: stringScheme,
    valueRequired: v => !v.value,
    valueMinLength: v => v.value.length <= 6
  });

  const res = scheme.validate({ value: "" });
  t.deepEqual(res, {
    value: { errors: [{ type: "required" }] },
    errors: [{ type: "valueRequired" }]
  });

  t.deepEqual(
    scheme.validate({
      value: "sdfs"
    }),
    {
      value: { errors: [{ type: "minLenght" }] },
      errors: [{ type: "valueMinLength" }]
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

  const scheme = init<T>().rules({
    value: stringScheme,
    valueRequired: v => (!v.value ? "valueRequired" : false),
    valueMinLength: v => v.value.length <= 6
  });

  const res = scheme.validate({ value: "" });
  t.deepEqual(res, {
    value: { errors: [{ type: "required", error: { text: "empty" } }] },
    errors: [{ type: "valueRequired", error: "valueRequired" }]
  });

  t.deepEqual(
    scheme.validate({
      value: "sdfs"
    }),
    {
      value: { errors: [{ type: "minLenght", error: "myerror" }] },
      errors: [{ type: "valueMinLength" }]
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

  t.deepEqual(scheme.validate(""), { errors: [{ type: "required" }] });
  t.deepEqual(scheme.validate("sdfsf"), {
    errors: [{ type: "minLenght" }, { type: "contains4" }]
  });
  t.deepEqual(scheme.validate("sdfsfsfsdfsdf"), {
    errors: [{ type: "contains4" }]
  });
  t.deepEqual(scheme.validate("sdfsfsf4sdfsdf"), null);

  t.end();
});

test("validate. list of values", t => {
  type T = { value: string[] };

  const stringScheme = init<string>().rules({
    required: v => !v,
    minLenght: v => v.length <= 8
  });

  const scheme = init<T>().rules({
    value: list(stringScheme)
  });

  const validationResult = scheme.validate({
    value: ["", "sdfsdf", "123123123"]
  });
  t.deepEqual(validationResult, {
    value: [
      { errors: [{ type: "required" }] },
      { errors: [{ type: "minLenght" }] },
      null
    ]
  });

  t.deepEqual(
    scheme.validate({ value: ["qweasdzxc", "321311231", "123123123"] }),
    null
  );

  t.deepEqual(scheme.validate({ value: [] }), null);

  t.end();
});

test("validate. map of values", t => {
  type T = { value: { [name: string]: string } };

  const stringScheme = init<string>().rules({
    required: v => !v,
    minLenght: v => v.length <= 8
  });

  const scheme = init<T>().rules({
    value: map(stringScheme)
  });

  const validationResult = scheme.validate({
    value: { v1: "", v2: "sdfsdf", v3: "123123123" }
  });
  t.deepEqual(validationResult, {
    value: {
      v1: { errors: [{ type: "required" }] },
      v2: { errors: [{ type: "minLenght" }] }
    }
  });

  t.deepEqual(
    scheme.validate({
      value: { v1: "qweasdzxc", v2: "321311231", v3: "123123123" }
    }),
    null
  );

  t.end();
});

test("validate. simple value. falsy values", t => {
  t.deepEqual(
    init<string>()
      .rules({ nullAsValue: () => false })
      .validate(""),
    null
  );

  t.deepEqual(
    init<string>()
      .rules({ nullAsValue: () => null })
      .validate(""),
    null
  );

  t.deepEqual(
    init<string>()
      .rules({ undefidedAsValue: () => undefined })
      .validate(""),
    null
  );

  t.deepEqual(
    init<string>()
      .rules({ zeroAsValue: () => 0 })
      .validate(""),
    { errors: [{ type: "zeroAsValue", error: 0 }] }
  );

  t.deepEqual(
    init<string>()
      .rules({ emptyStringAsValue: () => "" })
      .validate(""),
    { errors: [{ type: "emptyStringAsValue", error: "" }] }
  );

  t.end();
});

test("validate. fields. falsy values", t => {
  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: { nullAsValue: () => null } })
      .validate({ f: "" }),
    null
  );

  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: { undefidedAsValue: () => undefined } })
      .validate({ f: "" }),
    null
  );

  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: { zeroAsValue: () => 0 } })
      .validate({ f: "" }),
    { f: { errors: [{ type: "zeroAsValue", error: 0 }] } }
  );

  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: { emptyStringAsValue: () => "" } })
      .validate({ f: "" }),
    { f: { errors: [{ type: "emptyStringAsValue", error: "" }] } }
  );

  t.end();
});

test("validate. all of. falsy values", t => {
  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: allOf({ nullAsValue: () => null }) })
      .validate({ f: "" }),
    null
  );

  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: allOf({ undefidedAsValue: () => undefined }) })
      .validate({ f: "" }),
    null
  );

  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: allOf({ zeroAsValue: () => 0 }) })
      .validate({ f: "" }),
    { f: { errors: [{ type: "zeroAsValue", error: 0 }] } }
  );

  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: allOf({ emptyStringAsValue: () => "" }) })
      .validate({ f: "" }),
    { f: { errors: [{ type: "emptyStringAsValue", error: "" }] } }
  );

  t.end();
});
