import type { Token, TokenType } from './types';

const OPERATORS = new Set([
  '+', '-', '*', '/', '>', '<', '>=', '<=', '==', '!=', '&&', '||', '!',
]);

const PUNCTUATION = new Set(['(', ')', '.', ',', '?', ':']);

const TWO_CHAR_OPERATORS = new Set(['>=', '<=', '==', '!=', '&&', '||']);

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isIdentChar(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    const ch = input[pos];

    if (isWhitespace(ch)) {
      pos++;
      continue;
    }

    if (isDigit(ch) || (ch === '.' && pos + 1 < input.length && isDigit(input[pos + 1]))) {
      const start = pos;
      let hasDecimal = ch === '.';
      if (hasDecimal) {
        pos++;
      }
      while (pos < input.length && isDigit(input[pos])) {
        pos++;
      }
      if (!hasDecimal && pos < input.length && input[pos] === '.') {
        pos++;
        while (pos < input.length && isDigit(input[pos])) {
          pos++;
        }
      }
      tokens.push({ type: 'Number', value: input.slice(start, pos), position: start });
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = pos;
      pos++;
      let str = '';
      while (pos < input.length && input[pos] !== quote) {
        if (input[pos] === '\\' && pos + 1 < input.length) {
          pos++;
          const escaped = input[pos];
          switch (escaped) {
            case 'n': str += '\n'; break;
            case 't': str += '\t'; break;
            case '\\': str += '\\'; break;
            default: str += escaped;
          }
        } else {
          str += input[pos];
        }
        pos++;
      }
      if (pos >= input.length) {
        throw new Error(`Unterminated string literal starting at position ${start}`);
      }
      pos++; // closing quote
      tokens.push({ type: 'String', value: str, position: start });
      continue;
    }

    if (isIdentStart(ch)) {
      const start = pos;
      while (pos < input.length && isIdentChar(input[pos])) {
        pos++;
      }
      const word = input.slice(start, pos);
      if (word === 'true' || word === 'false') {
        tokens.push({ type: 'Boolean', value: word, position: start });
      } else {
        tokens.push({ type: 'Identifier', value: word, position: start });
      }
      continue;
    }

    if (pos + 1 < input.length) {
      const twoChar = input.slice(pos, pos + 2);
      if (TWO_CHAR_OPERATORS.has(twoChar)) {
        tokens.push({ type: 'Operator', value: twoChar, position: pos });
        pos += 2;
        continue;
      }
    }

    if (OPERATORS.has(ch)) {
      tokens.push({ type: 'Operator', value: ch, position: pos });
      pos++;
      continue;
    }

    if (PUNCTUATION.has(ch)) {
      tokens.push({ type: 'Punctuation', value: ch, position: pos });
      pos++;
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at position ${pos}`);
  }

  tokens.push({ type: 'EOF' as TokenType, value: '', position: pos });
  return tokens;
}
