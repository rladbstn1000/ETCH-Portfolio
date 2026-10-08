// 합성 데모의 HTML 본문을 텍스트로 읽는다. 파싱된 DOM은 화면에 삽입하지 않는다.
export function projectDisplayText(content: string): string {
  const document = new DOMParser().parseFromString(content, "text/html");
  document.querySelectorAll("script,style,template,noscript,iframe,object,embed").forEach(node => node.remove());
  const blocks = new Set(["P", "DIV", "SECTION", "ARTICLE", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL", "BLOCKQUOTE", "PRE", "TR"]);
  const text = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node instanceof Element && node.tagName === "BR") return "\n";
    const body = Array.from(node.childNodes).map(text).join("");
    return node instanceof Element && blocks.has(node.tagName) ? `\n${body}\n` : body;
  };
  return text(document.body).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
