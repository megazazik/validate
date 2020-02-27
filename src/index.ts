import { Result, getErrors } from './result';

export { getErrors };

export type Rule<D, R, Meta> = Meta extends undefined
	? (obj: D, meta?: Meta) => R
	: (obj: D, meta: Meta) => R;

export type RuleError<K, R extends Rule<any, any, any>> = R extends (
	...args: any[]
) => boolean
	? { type: K }
	: { type: K; error: ReturnType<R> };

export type ObjectRules<T, Meta = undefined> = Record<
	string,
	Rule<T, any, Meta>
>;

export type RulesErrors<T, Rules extends ObjectRules<T, any>> = {
	[R in keyof Rules]: RuleError<R, Rules[R]>;
};

export type ValidationScheme<Data, Result, Meta = undefined> = {
	validate: (
		...args: Meta extends undefined ? [Data, any?] : [Data, Meta]
	) => null | Result;
};

type ChildMeta<T, Meta> = {
	data: T;
	meta: Meta;
	fieldName: keyof T;
};

type ChildrenRules<T, Meta> = {
	[F in keyof T]?:
		| ValidationScheme<T[F], any, ChildMeta<T, Meta>>
		| ObjectRules<T[F], ChildMeta<T, Meta>>;
};

type ObjectRulesNames<D, C extends SchemeRules<D, any>> = {
	[F in keyof C]: C[F] extends Rule<D, any, any> ? F : never;
}[keyof C];

type ChildRulesNames<D, C extends SchemeRules<D, any>> = {
	[F in keyof C]: F extends keyof D ? F : never;
}[keyof C];

type CheckIfEmptyKeys<Keys, Success, Wrong> = Wrong extends (Keys extends never
	? Success
	: Wrong)
	? Wrong
	: Success;

type ErrorsOf<T> = { errors: Array<T[keyof T]> | null };

export type ChildResult<
	Children extends {
		[F: string]: undefined | ValidationScheme<any, any, any>;
	}
> = {
	[F in keyof Children]?: Children[F] extends ValidationScheme<any, any, any>
		? ReturnType<Children[F]['validate']>
		: never;
};

export type ValidationResult<
	Data,
	Rules extends { [R: string]: Rule<Data, any, any> },
	Children extends { [F in keyof Data]?: ValidationScheme<Data[F], any, any> }
> = null | Readonly<
	ChildResult<Children> &
		ErrorsOf<RulesErrors<any, Rules>> &
		{ [R in keyof Rules]?: ReturnType<Rules[R]> }
>;

export type SchemeRules<D, Meta> = Record<
	string,
	| Rule<D, any, Meta>
	| ValidationScheme<any, any, any>
	| {
			[R: string]: Rule<any, any, any>;
	  }
>;

export interface Scheme<
	Data,
	Rules extends ObjectRules<Data, Meta>,
	Children extends {
		[F in keyof Data]?: ValidationScheme<
			Data[F],
			any,
			ChildMeta<Data, Meta>
		>;
	} = {},
	Meta = undefined
>
	extends ValidationScheme<
		Data,
		ValidationResult<Data, Rules, Children>,
		Meta
	> {
	rules<C extends SchemeRules<Data, Meta>>(
		children: C & ChildrenRules<Data, Meta>
	): CheckIfEmptyKeys<
		Exclude<keyof C, ChildRulesNames<Data, C> | ObjectRulesNames<Data, C>>,
		Scheme<
			Data,
			Rules & Pick<C, ObjectRulesNames<Data, C>>,
			Children &
				ChildrenSchemes<
					Data,
					Pick<C, ChildRulesNames<Data, C>>,
					ChildMeta<Data, Meta>
				>,
			Meta
		>,
		| 'Wrong type of rules. Check the following fields:'
		| Exclude<keyof C, ChildRulesNames<Data, C> | ObjectRulesNames<Data, C>>
	>;
	rules<C extends SchemeRules<Data, Meta>>(
		children: (rules: Rules & Children) => C & ChildrenRules<Data, Meta>
	): CheckIfEmptyKeys<
		Exclude<keyof C, ChildRulesNames<Data, C> | ObjectRulesNames<Data, C>>,
		Scheme<
			Data,
			Rules & Pick<C, ObjectRulesNames<Data, C>>,
			Children &
				ChildrenSchemes<
					Data,
					Pick<C, ChildRulesNames<Data, C>>,
					ChildMeta<Data, Meta>
				>,
			Meta
		>,
		| 'Wrong type of rules. Check the following fields:'
		| Exclude<keyof C, ChildRulesNames<Data, C> | ObjectRulesNames<Data, C>>
	>;
	getRules(): Rules & Children;
}

export interface PrimitiveScheme<
	Data,
	Rules extends ObjectRules<Data, unknown>,
	Meta = undefined
> extends ValidationScheme<Data, ValidationResult<Data, Rules, {}>, Meta> {
	rules<NewRules extends Record<string, Rule<Data, any, Meta>>>(
		children: NewRules
	): PrimitiveScheme<Data, Rules & NewRules, Meta>;
	getRules(): Rules;
}

export type ChildrenSchemes<
	Data,
	Rules extends ChildrenRules<any, any>,
	Meta
> = {
	[Child in keyof Rules]: ChildScheme<
		Rules[Child],
		Child extends keyof Data ? Data[Child] : any,
		Meta
	>;
};

export type ChildScheme<
	C extends
		| ValidationScheme<any, any, any>
		| { [R: string]: Rule<any, any, any> }
		| undefined,
	Data,
	Meta
> = C extends ValidationScheme<any, any>
	? C
	: Data extends object
	? Scheme<
			Data,
			C extends Record<string, Rule<any, any, Meta>> ? C : {},
			{},
			Meta
	  >
	: PrimitiveScheme<Data, C extends undefined ? {} : C, Meta>;

export function init<Data, Meta = undefined>(): Data extends object
	? Scheme<Data, {}, {}, Meta>
	: PrimitiveScheme<Data, {}, Meta>;

export function init<Data, Meta = undefined>(
	rules = {},
	schemes = {}
): Data extends object
	? Scheme<Data, {}, {}, Meta>
	: PrimitiveScheme<Data, {}, Meta> {
	return new Builder<Data, {}, {}>(rules, schemes) as any;
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
	Rules extends { [R: string]: Rule<Data, any, Meta> },
	Children extends {
		[F in keyof Data]?: ValidationScheme<
			Data[F],
			any,
			ChildMeta<Data, Meta>
		>;
	} = {},
	Meta = undefined
> implements Scheme<Data, Rules, Children, Meta> {
	constructor(private _fullObjectRules: Rules, private _rules: Children) {}

	rules<C extends SchemeRules<Data, Meta>>(
		fullRules:
			| (C & ChildrenRules<Data, Meta>)
			| ((rules: Rules & Children) => C & ChildrenRules<Data, Meta>)
	) {
		const [childrenRules, rules] = separateRules(
			typeof fullRules === 'function'
				? fullRules(this.getRules())
				: fullRules
		);
		const convertedRules = Object.keys(childrenRules).reduce(
			(prev, propertyName) => ({
				...prev,
				[propertyName]:
					typeof (childrenRules as any)[propertyName].validate ===
					'function'
						? (childrenRules as any)[propertyName]
						: init<object>().rules(
								(childrenRules as any)[propertyName]
						  )
			}),
			{}
		);

		return new Builder(
			{ ...this._fullObjectRules, ...rules },
			{ ...this._rules, ...convertedRules }
		) as any;
	}

	validate(
		...args: Meta extends undefined ? [Data, any?] : [Data, Meta]
	): ValidationResult<Data, Rules, Children> {
		let hasErrors = false;
		const ownRulesErrors = validateRules(
			args[0],
			this._fullObjectRules,
			args[1]!
		);
		if (ownRulesErrors) {
			hasErrors = true;
		}

		const errors: any = new Result(ownRulesErrors || {});

		if (args[0] != null) {
			Object.keys(this._rules).forEach(key => {
				const res = (this._rules as any)[key].validate(
					(args[0] as any)[key],
					{
						data: args[0],
						meta: args[1],
						fieldName: key
					}
				);
				if (res) {
					hasErrors = true;
					errors[key] = res;
				}
			});
		}

		return hasErrors ? errors : null;
	}

	getRules(): Rules & Children {
		return { ...this._fullObjectRules, ...this._rules };
	}
}

function separateRules(
	rules: SchemeRules<any, any>
): [ChildrenRules<any, any>, Record<string, Rule<any, any, any>>] {
	const childrenRules: ChildrenRules<any, any> = {};
	const objectRules: Record<string, Rule<any, any, any>> = {};

	for (const key in rules) {
		const rule = rules[key];
		if (typeof rule === 'function') {
			objectRules[key] = rule;
		} else {
			childrenRules[key] = rule as any;
		}
	}

	return [childrenRules, objectRules];
}

export function validateRules<D, Meta = undefined>(
	data: D,
	rules: { [R: string]: Rule<D, any, Meta> },
	meta: Meta
) {
	let errors: any = null;

	Object.keys(rules).find(key => {
		if ((rules[key] as any).isAllOfFlag === isAllOfFlag) {
			const allOfRules = rules[key](data, meta);

			const allErrors: any = {};
			let hasError = false;
			Object.keys(allOfRules).forEach(ruleKey => {
				const res = allOfRules[ruleKey](data, meta);
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

		const result = rules[key](data, meta);
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

export function allOf<
	T,
	Rules extends { [R: string]: Rule<T, any, Meta> },
	Meta
>(rules: Rules): Rules {
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

export function list<Data, Result, Meta = undefined>(
	scheme: ValidationScheme<
		Data,
		Result,
		{
			data: Data[];
			meta: Meta;
			index: number;
		}
	>
): ValidationScheme<Data[], Array<Result | null>, Meta> {
	return {
		validate: (
			...args: Meta extends undefined ? [Data[], any?] : [Data[], Meta]
		) => {
			let hasError = false;
			const result = args[0].map((d, index) => {
				const res = scheme.validate(d, {
					meta: args[1],
					data: args[0],
					index
				});
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

export function map<Data, Result, Meta = undefined>(
	scheme: ValidationScheme<
		Data,
		Result,
		{
			fieldName: string;
			meta: Meta;
			data: Record<string, Data>;
		}
	>
): ValidationScheme<Record<string, Data>, Record<string, Result | null>, Meta> {
	return {
		validate: (
			...args: Meta extends undefined
				? [Record<string, Data>, any?]
				: [Record<string, Data>, Meta]
		) => {
			let hasError = false;
			const result = Object.keys(args[0]).reduce((prev, name) => {
				const res = scheme.validate(args[0][name], {
					meta: args[1],
					data: args[0],
					fieldName: name
				});

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

export function passMeta<Data, Result, Meta, Key extends string>(
	key: Key,
	scheme: ValidationScheme<Data, Result, Meta>
): ValidationScheme<Data, Result, { [K in Key]: Meta }>;
export function passMeta<Data, Result, Meta, NewMeta>(
	key: (meta: NewMeta) => Meta,
	scheme: ValidationScheme<Data, Result, Meta>
): ValidationScheme<Data, Result, NewMeta>;
export function passMeta<Data, Result, Meta>(
	key: string | ((m: any) => any),
	scheme: ValidationScheme<Data, Result, Meta>
) {
	return {
		validate(data: Data, meta?: any) {
			return (scheme as any).validate(
				data,
				typeof key === 'string' ? meta?.[key] : key(meta)
			);
		}
	};
}
