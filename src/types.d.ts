type PartialExcept<
    ParameterType,
    ParameterField extends keyof ParameterType,
> = Pick<ParameterType, ParameterField> &
    Partial<Omit<ParameterType, ParameterField>>;
