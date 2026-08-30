import { dump } from "js-yaml";

// YAML is whitespace-sensitive enough that hand-rolling a serializer is a
// real correctness risk -- delegate to js-yaml rather than reinventing it.
export const jsonToYaml = (data) => dump(data, { indent: 2, lineWidth: 100 });
