import { Ruleset, IValidationGroup } from "@treacherous/core";
export interface RulesetOptions {
    withReactiveValidation?: boolean;
    validateOnStart?: boolean;
    validateProps?: boolean;
    validateComputed?: boolean;
}
export declare const ValidateWith: (ruleset: Ruleset, options?: RulesetOptions) => {
    data(): {
        validationGroup: IValidationGroup;
        modelErrors: {};
    };
    computed: {
        isValid: () => boolean;
    };
    watch: {
        isValid: (isValid: boolean) => void;
    };
    created(): void;
    beforeDestroy(): void;
};
export { viewStrategyRegistry } from "@treacherous/view";
export { createRuleset, ruleRegistry } from "@treacherous/core";
declare const _default: {
    install: (Vue: any, options: any) => void;
};
export default _default;
