import { Result, getErrors } from "./result";

export { getErrors };

export type Rule<D, R = boolean, FullData = any> = (
  obj: D,
  fullData?: FullData
) => R;

export type RuleError<K, R extends Rule<any, any>> = R extends (
  data: any
) => boolean
  ? { type: K }
  : { type: K; error: ReturnType<R> };

export type ObjectRules<T, FullData> = {
  [R: string]: Rule<T, any, FullData>;
};

export type RulesErrors<T, Rules extends ObjectRules<T, any>> = {
  [R in keyof Rules]: RuleError<R, Rules[R]>;
};

export type ValidationScheme<Data, Result, FullData = any> = {
  validate(data: Data, fullData?: FullData): null | Result;
};

type ChildrenRules<T> = {
  [F in keyof T]?: ValidationScheme<T[F], any, T> | ObjectRules<T[F], T>;
};

type ObjectRulesNames<D, C extends SchemeRules<D>> = {
  [F in keyof C]: C[F] extends Rule<D, any> ? F : never;
}[keyof C];

type ChildRulesNames<D, C extends SchemeRules<D>> = {
  [F in keyof C]: F extends keyof D ? F : never;
}[keyof C];

type CheckIfEmptyKeys<Keys, Success, Wrong> = Wrong extends (Keys extends never
? Success
: Wrong)
  ? Wrong
  : Success;

type ErrorsOf<T> = { errors: Array<T[keyof T]> };

export type ChildResult<
  Children extends { [F: string]: undefined | ValidationScheme<any, any> }
> = {
  [F in keyof Children]?: Children[F] extends ValidationScheme<any, any>
    ? ReturnType<Children[F]["validate"]>
    : never;
};

export type ValidationResult<
  Data,
  Rules extends { [R: string]: Rule<Data, any> },
  Children extends { [F in keyof Data]?: ValidationScheme<Data[F], any, Data> }
> = null | Readonly<
  ChildResult<Children> &
    ErrorsOf<RulesErrors<any, Rules>> &
    { [R in keyof Rules]?: ReturnType<Rules[R]> }
>;

export type SchemeRules<D> = Record<
  string,
  Rule<D, any> | ValidationScheme<any, any> | { [R: string]: Rule<any, any, D> }
>;

export interface Scheme<
  Data,
  Rules extends ObjectRules<Data, unknown>,
  Children extends {
    [F in keyof Data]?: ValidationScheme<Data[F], any, Data>;
  } = {}
> {
  validate(data: Data): ValidationResult<Data, Rules, Children>;
  rules<C extends SchemeRules<Data>>(
    children: C & ChildrenRules<Data>
  ): CheckIfEmptyKeys<
    Exclude<keyof C, ChildRulesNames<Data, C> | ObjectRulesNames<Data, C>>,
    Scheme<
      Data,
      Rules & Pick<C, ObjectRulesNames<Data, C>>,
      Children & ChildrenSchemes<Data, Pick<C, ChildRulesNames<Data, C>>>
    >,
    | "Wrong type of rules. Check the following fields:"
    | Exclude<keyof C, ChildRulesNames<Data, C> | ObjectRulesNames<Data, C>>
  >;
}

export interface PrimitiveScheme<
  Data,
  Rules extends ObjectRules<Data, unknown>
> {
  validate(data: Data): ValidationResult<Data, Rules, {}>;
  rules<Rules extends Record<string, Rule<Data, any>>>(
    children: Rules
  ): PrimitiveScheme<Data, Rules & Rules>;
}

export type ChildrenSchemes<Data, Rules extends ChildrenRules<any>> = {
  [Child in keyof Rules]: ChildScheme<
    Rules[Child],
    Child extends keyof Data ? Data[Child] : any
  >;
};

export type ChildScheme<
  C extends
    | ValidationScheme<any, any>
    | { [R: string]: Rule<any, any> }
    | undefined,
  Data
> = C extends ValidationScheme<any, any>
  ? C
  : Scheme<Data, C extends undefined ? {} : C, {}>;

export function init<Data>(): Data extends object
  ? Scheme<Data, {}, {}>
  : PrimitiveScheme<Data, {}> {
  return new Builder<Data, {}, {}>({}, {}) as any;
}

export type RulesOfScheme<S extends Scheme<any, any, any>> = S extends Scheme<
  any,
  infer R,
  any
>
  ? R
  : never;

export type ChildrenOfScheme<
  S extends Scheme<any, any, any>
> = S extends Scheme<any, any, infer R> ? R : never;

class Builder<
  Data,
  Rules extends { [R: string]: Rule<Data, any> },
  Children extends {
    [F in keyof Data]?: ValidationScheme<Data[F], any, Data>;
  } = {}
> implements Scheme<Data, Rules, Children> {
  constructor(private _fullObjectRules: Rules, private _rules: Children) {}

  rules<C extends SchemeRules<Data>>(fullRules: C & ChildrenRules<Data>) {
    const [childrenRules, rules] = separateRules(fullRules);
    const convertedRules = Object.keys(childrenRules).reduce(
      (prev, propertyName) => ({
        ...prev,
        [propertyName]:
          typeof (childrenRules as any)[propertyName].validate === "function"
            ? (childrenRules as any)[propertyName]
            : init<object>().rules((childrenRules as any)[propertyName])
      }),
      {}
    );

    return new Builder(
      { ...this._fullObjectRules, ...rules },
      { ...this._rules, ...convertedRules }
    ) as any;
  }

  validate(data: Data): ValidationResult<Data, Rules, Children> {
    let hasErrors = false;
    const ownRulesErrors = validateRules(data, this._fullObjectRules);
    if (ownRulesErrors) {
      hasErrors = true;
    }

    const errors: any = new Result(ownRulesErrors || {});

    Object.keys(this._rules).forEach(key => {
      const res = (this._rules as any)[key].validate((data as any)[key]);
      if (res) {
        hasErrors = true;
        errors[key] = res;
      }
    });
    return hasErrors ? errors : null;
  }
}

function separateRules(
  rules: SchemeRules<any>
): [ChildrenRules<any>, Record<string, Rule<any, any>>] {
  const childrenRules: ChildrenRules<any> = {};
  const objectRules: Record<string, Rule<any, any>> = {};

  for (const key in rules) {
    const rule = rules[key];
    if (typeof rule === "function") {
      objectRules[key] = rule;
    } else {
      childrenRules[key] = rule;
    }
  }

  return [childrenRules, objectRules];
}

export function validateRules<D>(
  data: D,
  rules: { [R: string]: Rule<D, any> }
) {
  let errors: any = null;

  Object.keys(rules).find(key => {
    if ((rules[key] as any).isAllOfFlag === isAllOfFlag) {
      const allOfRules = rules[key](data);

      const allErrors: any = {};
      let hasError = false;
      Object.keys(allOfRules).forEach(ruleKey => {
        const res = allOfRules[ruleKey](data);
        if (res === false || res == null) {
          return;
        }
        hasError = true;
        allErrors[ruleKey] = res;
      });

      if (hasError) {
        errors = allErrors;
        return true;
      }

      return false;
    }

    const result = rules[key](data);
    if (result === false || result == null) {
      return false;
    }

    errors = { [key]: result };

    return true;
  });

  return errors;
}

// все из списка правил

const isAllOfFlag = {};

export function allOf<T, Rules extends { [R: string]: Rule<T, any> }>(
  rules: Rules
): Rules {
  return Object.keys(rules).reduce((prev, key, index) => {
    if (index === 0) {
      const rule: any = () => rules;
      rule.isAllOfFlag = isAllOfFlag;
      return { ...prev, [key]: rule };
    }

    return { ...prev, [key]: () => false };
  }, {}) as any;
}

// правила для массивов

export function list<S extends ValidationScheme<Data, any, Data[]>, Data>(
  scheme: S
): ValidationScheme<Data[], Array<ReturnType<S["validate"]>>> {
  return {
    validate: (data: Data[]) => {
      let hasError = false;
      const result = data.map(d => {
        const res = scheme.validate(d);
        if (res) {
          hasError = true;
        }
        return res;
      });
      return hasError ? result : null;
    }
  };
}

// правила для объектов

export function map<
  S extends ValidationScheme<Data, any, Record<string, Data>>,
  Data
>(
  scheme: S
): ValidationScheme<
  Record<string, Data>,
  Record<string, ReturnType<S["validate"]>>
> {
  return {
    validate: (data: { [name: string]: Data }) => {
      let hasError = false;
      const result = Object.keys(data).reduce((prev, name) => {
        const res = scheme.validate(data[name]);

        if (res) {
          hasError = true;
          return {
            ...prev,
            [name]: res
          };
        }
        return prev;
      }, {});
      return hasError ? result : null;
    }
  };
}
