type PartialExcept<
    ParameterType,
    ParameterField extends keyof ParameterType,
> = Pick<ParameterType, ParameterField> &
    Partial<Omit<ParameterType, ParameterField>>;

type Explode<T> = keyof T extends infer K
    ? K extends unknown
        ? { [I in keyof T]: I extends K ? T[I] : never }
        : never
    : never;
type AtMostOne<T> = Explode<Partial<T>>;
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
    U[keyof U];
type ExactlyOne<T> = AtMostOne<T> & AtLeastOne<T>;
