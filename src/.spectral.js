import { oas } from "@stoplight/spectral-rulesets";
import owaspRuleset from "@stoplight/spectral-owasp-ruleset";

export default {
  extends: [oas, owaspRuleset],
};
