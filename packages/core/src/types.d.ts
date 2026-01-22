/**
 * Type declarations for third-party modules without built-in types
 */

declare module 'plantuml-encoder' {
  function encode(plantumlCode: string): string;
  function decode(encoded: string): string;
  export default encode;
}
