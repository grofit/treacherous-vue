import {createRuleset} from "treacherous";

export function generateRuleset()
{
    var hobbyRuleset = createRuleset()
        .forProperty("name")
            .addRule("required")
            .addRule("minLength", 2)
            .addRule("maxLength", 20)
        .build();

    var modelRuleset = createRuleset()
        .forProperty("name")
            .addRule("required")
            .addRule("minLength", 2)
        .forProperty("age")
            .addRule("required")
            .addRule("number")
        .forProperty("hobbies")
            .addRulesetForEach(hobbyRuleset)
        .build();

    return modelRuleset;
}