/**
 * Strip markdown formatting from LLM-generated text.
 * Removes #, *, _, `, >, -, **bold**, *italic*, code fences, etc.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    // Remove code fences
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`{1,2}([^`]+)`{1,2}/g, "$1")
    // Remove headers (## Heading → Heading)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove inline links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove image syntax ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Remove bullet list markers at start of line
    .replace(/^\s*[-*+]\s+/gm, "")
    // Remove numbered list markers
    .replace(/^\s*\d+\.\s+/gm, "")
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
