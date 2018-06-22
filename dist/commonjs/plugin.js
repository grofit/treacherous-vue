"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const treacherous_1 = require("treacherous");
const treacherous_view_1 = require("treacherous-view");
const ValidationSubKey = "validation-subscriptions";
const SummarySubKey = "summary-subscriptions";
exports.ValidateWith = (ruleset, options = {}) => {
    return {
        data() {
            return {
                validationGroup: null,
                modelErrors: {}
            };
        },
        computed: {
            isValid: function () {
                return Object.keys(this.modelErrors).length == 0;
            }
        },
        watch: {
            isValid: function (isValid) {
                this.$emit("model-state-changed", { isValid: isValid, errors: this.modelErrors });
            }
        },
        created() {
            const context = this;
            if (options.withReactiveValidation === undefined) {
                options.withReactiveValidation = false;
            }
            if (options.validateComputed === undefined) {
                options.validateComputed = false;
            }
            if (options.validateProps === undefined) {
                options.validateProps = false;
            }
            if (options.validateOnStart === undefined) {
                options.validateOnStart = false;
            }
            const proxyHandler = {
                get(obj, prop) {
                    const hasProperty = Reflect.has(obj, prop);
                    if (hasProperty) {
                        return Reflect.get(obj, prop);
                    }
                    if (options.validateProps && Reflect.has(context._props, prop)) {
                        return Reflect.get(context._props, prop);
                    }
                    if (options.validateComputed && Reflect.has(context._computed, prop)) {
                        return Reflect.get(context._computed, prop);
                    }
                    return undefined;
                }
            };
            const virtualModel = new Proxy(context._data, proxyHandler);
            let validationGroupBuilder = treacherous_1.createGroup();
            if (options.withReactiveValidation) {
                validationGroupBuilder = validationGroupBuilder.asReactiveGroup();
            }
            if (options.validateOnStart) {
                validationGroupBuilder = validationGroupBuilder.andValidateOnStart();
            }
            const metadata = {};
            context.validationGroup = validationGroupBuilder.build(virtualModel, ruleset);
            context._validationMetadata = metadata;
            metadata[ValidationSubKey] = {};
            metadata[SummarySubKey] = [];
        },
        beforeDestroy() {
            this.validationGroup.release();
        }
    };
};
const showErrorDirective = {
    bind: function (element, binding, vnode) {
        const context = vnode.context;
        const validationGroup = context.validationGroup;
        if (!validationGroup) {
            return;
        }
        const metadata = context._validationMetadata;
        const propertyRoute = treacherous_view_1.ElementHelper.getPropertyRouteFrom(element);
        if (!propertyRoute) {
            return;
        }
        const strategyName = treacherous_view_1.ElementHelper.getViewStrategyFrom(element);
        const viewStrategy = treacherous_view_1.viewStrategyRegistry.getStrategyNamed(strategyName || "inline");
        if (!viewStrategy) {
            return;
        }
        let validationState = treacherous_view_1.ValidationState.unknown;
        const viewOptions = treacherous_view_1.ElementHelper.getViewOptionsFrom(element) || {};
        let handlePossibleError = (error) => {
            if (!error) {
                viewStrategy.propertyBecomeValid(element, propertyRoute, validationState, viewOptions);
                validationState = treacherous_view_1.ValidationState.valid;
                context.$delete(context.modelErrors, propertyRoute);
            }
            else {
                viewStrategy.propertyBecomeInvalid(element, error, propertyRoute, validationState, viewOptions);
                validationState = treacherous_view_1.ValidationState.invalid;
                context.$set(context.modelErrors, propertyRoute, error);
            }
        };
        const handlePropertyStateChange = (args) => {
            handlePossibleError(args.error);
        };
        const propertyPredicate = (args) => {
            return args.property == propertyRoute;
        };
        const sub = validationGroup.propertyStateChangedEvent.subscribe(handlePropertyStateChange, propertyPredicate);
        metadata[ValidationSubKey][propertyRoute] = sub;
    },
    unbind: function (element, binding, vnode) {
        let context = vnode.context;
        let propertyRoute = treacherous_view_1.ElementHelper.getPropertyRouteFrom(element);
        if (!propertyRoute) {
            return;
        }
        let metadata = context._validationMetadata;
        let outstandingSub = metadata[ValidationSubKey][propertyRoute];
        if (outstandingSub) {
            outstandingSub();
        }
    }
};
const summaryDirective = {
    bind: function (element, binding, vnode) {
        const context = vnode.context;
        if (!context._validationMetadata) {
            context._validationMetadata = {};
            context._validationMetadata[SummarySubKey] = [];
        }
        const metadata = context._validationMetadata;
        let validationGroups = null;
        if (binding.value != null) {
            validationGroups = binding.value;
        }
        else {
            validationGroups = context.validationGroup;
        }
        if (!validationGroups) {
            return;
        }
        const isArray = Array.isArray(validationGroups);
        const getDisplayName = (propertyRoute) => {
            if (!isArray) {
                return validationGroups.getPropertyDisplayName(propertyRoute);
            }
            let finalName = propertyRoute;
            validationGroups.forEach((validationGroup) => {
                let returnedName = validationGroup.getPropertyDisplayName(propertyRoute);
                if (returnedName != propertyRoute) {
                    finalName = returnedName;
                }
            });
            return finalName;
        };
        const strategyName = treacherous_view_1.ElementHelper.getSummaryStrategyFrom(element);
        const summaryStrategy = treacherous_view_1.viewSummaryRegistry.getSummaryNamed(strategyName || "default");
        if (!summaryStrategy) {
            return;
        }
        const viewOptions = treacherous_view_1.ElementHelper.getSummaryOptionsFrom(element) || {};
        summaryStrategy.setupContainer(element, viewOptions);
        const handleStateChange = (eventArgs) => {
            const displayName = getDisplayName(eventArgs.property);
            if (eventArgs.isValid) {
                summaryStrategy.propertyBecomeValid(element, displayName, viewOptions);
            }
            else {
                summaryStrategy.propertyBecomeInvalid(element, eventArgs.error, displayName, viewOptions);
            }
        };
        if (isArray) {
            validationGroups.forEach((validationGroup) => {
                const sub = validationGroup.propertyStateChangedEvent.subscribe(handleStateChange);
                metadata[SummarySubKey].push(sub);
            });
        }
        else {
            const sub = validationGroups.propertyStateChangedEvent.subscribe(handleStateChange);
            metadata[SummarySubKey].push(sub);
        }
    },
    unbind: function (element, binding, vnode) {
        const context = vnode.context;
        const metadata = context._validationMetadata;
        metadata[SummarySubKey].foreach((x) => x());
    }
};
const install = function (Vue, options) {
    Vue.directive('show-error', showErrorDirective);
    Vue.directive('validation-summary', summaryDirective);
};
var treacherous_view_2 = require("treacherous-view");
exports.viewStrategyRegistry = treacherous_view_2.viewStrategyRegistry;
var treacherous_2 = require("treacherous");
exports.createRuleset = treacherous_2.createRuleset;
exports.ruleRegistry = treacherous_2.ruleRegistry;
exports.default = {
    install: install
};
