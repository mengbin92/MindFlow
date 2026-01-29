declare module 'plantuml-encoder' {
  /**
   * PlantUML 编码器
   * 用于将 PlantUML 文本编码为 URL 安全的字符串
   */
  export function encode(text: string): string;

  /**
   * PlantUML 解码器
   * 用于将编码后的字符串解码回原始文本
   */
  export function decode(encoded: string): string;

  /**
   * 压缩 PlantUML 文本
   */
  export function deflate(text: string): string;

  /**
   * 解压 PlantUML 文本
   */
  export function inflate(compressed: string): string;

  /**
   * 默认导出
   */
  const plantumlEncoder: {
    encode: typeof encode;
    decode: typeof decode;
    deflate: typeof deflate;
    inflate: typeof inflate;
  };

  export default plantumlEncoder;
}
