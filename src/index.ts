export type Rule<D, R = any> = (obj: D) => boolean | R;

export type RuleError<K, R extends Rule<any, any>> = R extends (
  data: any
) => boolean
  ? { type: K }
  : { type: K; error: ReturnType<R> };

type ValuesOf<T> = Array<T[keyof T]>;

export type RulesErrors<T, Rules extends { [R: string]: Rule<T, any> }> = {
  [R in keyof Rules]: RuleError<R, Rules[R]>;
};

export interface Scheme<
  Data,
  Rules extends { [R: string]: Rule<Data, any> },
  Children extends { [F in keyof Data]?: ValidationScheme<Data[F], any> } = {}
> {
  validate(
    data: Data
  ): null | (ChildResult<Children> & ValuesOf<RulesErrors<any, Rules>>);
  rules<R extends { [R: string]: Rule<Data, any> }>(
    rules: R
  ): Scheme<Data, Rules & R, Children>;
  children<C extends { [F in keyof Data]?: ValidationScheme<Data[F], any> }>(
    children: C
  ): Scheme<Data, Rules, Children & C>;
}

export type ValidationScheme<Data, Result> = {
  validate(data: Data): null | Result;
};

type RulesOfScheme<S extends Scheme<any, any, any>> = S extends Scheme<
  any,
  infer R,
  any
>
  ? R
  : never;

type ChildrenOfScheme<S extends Scheme<any, any, any>> = S extends Scheme<
  any,
  infer R,
  any
>
  ? R
  : never;

export type ValidationResult<S extends Scheme<any, any, any>> =
  | null
  | ChildResult<ChildrenOfScheme<S>> &
      ValuesOf<RulesErrors<any, RulesOfScheme<S>>>;

type ChildResult<
  Children extends { [F: string]: ValidationScheme<any, any> }
> = {
  [F in keyof Children]?: ReturnType<Children[F]["validate"]>;
};

export function init<Data>(): Scheme<Data, {}, {}> {
  return new Builder<Data, {}, {}>({}, {});
}

class Builder<
  Data,
  Rules extends { [R: string]: Rule<Data, any> },
  Children extends { [F in keyof Data]?: ValidationScheme<Data[F], any> } = {}
> implements Scheme<Data, Rules, Children> {
  constructor(private _rules: Rules, private _children: Children) {}

  rules<R extends { [R: string]: Rule<Data, any> }>(rules: R) {
    return new Builder<Data, Rules & R, Children>(
      { ...this._rules, ...rules },
      { ...this._children }
    );
  }

  children<C extends { [F in keyof Data]?: ValidationScheme<Data[F], any> }>(
    children: C
  ) {
    return new Builder<Data, Rules, Children & C>(
      { ...this._rules },
      { ...this._children, ...children }
    );
  }

  validate(
    data: Data
  ): null | (ChildResult<Children> & ValuesOf<RulesErrors<any, Rules>>) {
    let hasErrors = false;
    const ownRules = validateRules(data, this._rules);
    if (ownRules) {
      hasErrors = true;
    }

    const errors = ownRules || [];

    Object.keys(this._children).forEach(key => {
      const res = (this._children as any)[key].validate((data as any)[key]);
      if (res) {
        hasErrors = true;
        errors[key] = res;
      }
    });
    return hasErrors ? errors : null;
  }
}

export function validateRules<D>(
  data: D,
  rules: { [R: string]: Rule<D, any> }
) {
  let errors: any = null;

  Object.keys(rules).find(key => {
    if ((rules[key] as any).isAllOfFlag === isAllOfFlag) {
      const allOfRules = rules[key](data);

      const allErrors = Object.keys(allOfRules)
        .map(ruleKey => {
          const res = allOfRules[ruleKey](data);
          if (res) {
            return getError(ruleKey, res);
          }

          return res;
        })
        .filter(Boolean);

      if (allErrors.length > 0) {
        errors = allErrors;
        return true;
      }

      return false;
    }
    const result = rules[key](data);
    if (result) {
      errors = [getError(key, result)];

      return true;
    }

    return false;
  });

  return errors;
}

function getError(key: string, result: any) {
  return result === true
    ? { type: key }
    : {
        type: key,
        error: result
      };
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

export function list<S extends ValidationScheme<Data, any>, Data>(scheme: S) {
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

export function map<S extends ValidationScheme<Data, any>, Data>(scheme: S) {
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
