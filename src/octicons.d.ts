declare module "@primer/octicons" {
  interface Octicon {
    toSVG(options?: { width?: number; height?: number; class?: string }): string;
  }
  const octicons: Record<string, Octicon>;
  export default octicons;
}

declare module "*.html" {
  const content: string;
  export default content;
}
