import test from "tape";
import { init, allOf, list, map, getErrors } from "..";

const required = <V = any>(data: V) => !data;

test("validate. simple value", t => {
  const scheme = init<string>().rules({
    required,
    minLenght: v => v.length <= 8
  });

  t.deepEqual(scheme.validate("")?.errors, [{ type: "required" }]);
  t.deepEqual(scheme.validate("").required, true);
  t.deepEqual(scheme.validate(""), { required: true });
  t.deepEqual(scheme.validate("sdfsf")?.errors, [{ type: "minLenght" }]);
  t.deepEqual(scheme.validate("sdfsf").minLenght, true);
  t.deepEqual(scheme.validate("sdfsf"), { minLenght: true });
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
    value: { required: true }
  });

  t.deepEqual(result1.value.errors, [{ type: "required" }]);

  t.deepEqual(scheme.validate({ value: "sdfsf" }).errors, null);

  t.deepEqual(scheme.validate({ value: "sdfsf" }), {
    value: { minLenght: true }
  });

  t.deepEqual(scheme.validate({ value: "sdfsf" }).value.errors, [
    { type: "minLenght" }
  ]);

  t.deepEqual(scheme.validate({ value: "sdfsfsfsdfsdf" }), null);

  t.end();
});

test("validate. nested rules via scheme. getErrors", t => {
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
    value: { required: true }
  });

  t.deepEqual(getErrors(scheme.validate({ value: "" }).value), [
    { type: "required" }
  ]);

  t.deepEqual(getErrors(scheme.validate({ value: "sdfsf" })), null);

  t.deepEqual(getErrors(scheme.validate({ value: "sdfsf" }).value), [
    { type: "minLenght" }
  ]);

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
    value: { required: true }
  });

  t.deepEqual(scheme.validate({ value: "" }).value.errors, [
    { type: "required" }
  ]);

  const res = scheme.validate({ value: "sdfsf" });
  t.deepEqual(res, {
    value: { minLenght: true }
  });

  t.deepEqual(res.value.errors, [{ type: "minLenght" }]);

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
    value: { required: true },
    valueRequired: true
  });

  t.deepEqual(res.errors, [{ type: "valueRequired" }]);

  t.deepEqual(res.value.errors, [{ type: "required" }]);

  t.deepEqual(
    scheme.validate({
      value: "sdfs"
    }),
    {
      value: { minLenght: true },
      valueMinLength: true
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
    valueRequired: v => (!v.value ? "valueRequiredError" : false),
    valueMinLength: v => v.value.length <= 6
  });

  const res = scheme.validate({ value: "" });
  t.deepEqual(res, {
    value: { required: { text: "empty" } },
    valueRequired: "valueRequiredError"
  });

  t.deepEqual(res.errors, [
    { type: "valueRequired", error: "valueRequiredError" }
  ]);

  t.deepEqual(res.value.errors, [
    { type: "required", error: { text: "empty" } }
  ]);

  t.deepEqual(
    scheme.validate({
      value: "sdfs"
    }),
    {
      value: { minLenght: "myerror" },
      valueMinLength: true
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
      contains4: v => !v.includes("4") && "myError"
    })
  });

  t.deepEqual(scheme.validate(""), { required: true });
  t.deepEqual(scheme.validate("sdfsf"), {
    minLenght: true,
    contains4: "myError"
  });
  t.deepEqual(scheme.validate("sdfsf").errors, [
    { type: "minLenght" },
    { type: "contains4", error: "myError" }
  ]);
  t.deepEqual(scheme.validate("sdfsfsfsdfsdf"), {
    contains4: "myError"
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
    value: [{ required: true }, { minLenght: true }, null]
  });

  t.deepEqual(validationResult.errors, null);

  t.deepEqual(validationResult.value[0], { required: true });
  t.deepEqual(validationResult.value[0].errors, [{ type: "required" }]);

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
      v1: { required: true },
      v2: { minLenght: true }
    }
  });

  t.deepEqual(validationResult.errors, null);

  t.deepEqual(validationResult.value.v1, { required: true });

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
    { zeroAsValue: 0 }
  );

  t.deepEqual(
    init<string>()
      .rules({ emptyStringAsValue: () => "" })
      .validate(""),
    { emptyStringAsValue: "" }
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
    { f: { zeroAsValue: 0 } }
  );

  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: { emptyStringAsValue: () => "" } })
      .validate({ f: "" }),
    { f: { emptyStringAsValue: "" } }
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
    { f: { zeroAsValue: 0 } }
  );

  t.deepEqual(
    init<{ f: string }>()
      .rules({ f: allOf({ emptyStringAsValue: () => "" }) })
      .validate({ f: "" }),
    { f: { emptyStringAsValue: "" } }
  );

  t.end();
});
