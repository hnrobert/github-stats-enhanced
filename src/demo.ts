import _template from "../index.html" with { type: "text" };

const template = _template as unknown as string;

export function buildDemo(username: string, displayName: string): string {
  return template.replaceAll("hnrobert", username).replaceAll("Robert He", displayName);
}
