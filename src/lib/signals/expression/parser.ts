import type { ASTNode, BinaryOperator, Token } from './types';
import { tokenize } from './lexer';

class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: string, value?: string): Token {
    const token = this.peek();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new Error(
        `Expected ${type}${value ? ` '${value}'` : ''} at position ${token.position}, got ${token.type} '${token.value}'`
      );
    }
    return this.advance();
  }

  parse(): ASTNode {
    const node = this.parseExpression();
    if (this.peek().type !== 'EOF') {
      throw new Error(
        `Unexpected token '${this.peek().value}' at position ${this.peek().position}`
      );
    }
    return node;
  }

  private parseExpression(): ASTNode {
    return this.parseTernary();
  }

  private parseTernary(): ASTNode {
    let node = this.parseOr();

    if (this.peek().type === 'Punctuation' && this.peek().value === '?') {
      this.advance();
      const consequent = this.parseExpression();
      this.expect('Punctuation', ':');
      const alternate = this.parseExpression();
      node = { kind: 'TernaryExpression', condition: node, consequent, alternate };
    }

    return node;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.peek().type === 'Operator' && this.peek().value === '||') {
      const op = this.advance().value as BinaryOperator;
      const right = this.parseAnd();
      left = { kind: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseEquality();
    while (this.peek().type === 'Operator' && this.peek().value === '&&') {
      const op = this.advance().value as BinaryOperator;
      const right = this.parseEquality();
      left = { kind: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseComparison();
    while (
      this.peek().type === 'Operator' &&
      (this.peek().value === '==' || this.peek().value === '!=')
    ) {
      const op = this.advance().value as BinaryOperator;
      const right = this.parseComparison();
      left = { kind: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseAdditive();
    while (
      this.peek().type === 'Operator' &&
      (this.peek().value === '>' ||
        this.peek().value === '<' ||
        this.peek().value === '>=' ||
        this.peek().value === '<=')
    ) {
      const op = this.advance().value as BinaryOperator;
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();
    while (
      this.peek().type === 'Operator' &&
      (this.peek().value === '+' || this.peek().value === '-')
    ) {
      const op = this.advance().value as BinaryOperator;
      const right = this.parseMultiplicative();
      left = { kind: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();
    while (
      this.peek().type === 'Operator' &&
      (this.peek().value === '*' || this.peek().value === '/')
    ) {
      const op = this.advance().value as BinaryOperator;
      const right = this.parseUnary();
      left = { kind: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek().type === 'Operator' && this.peek().value === '!') {
      this.advance();
      const operand = this.parseUnary();
      return { kind: 'UnaryExpression', operator: '!', operand };
    }
    if (this.peek().type === 'Operator' && this.peek().value === '-') {
      this.advance();
      const operand = this.parseUnary();
      return { kind: 'UnaryExpression', operator: '-', operand };
    }
    return this.parseCallOrMember();
  }

  private parseCallOrMember(): ASTNode {
    let node = this.parsePrimary();

    while (true) {
      if (this.peek().type === 'Punctuation' && this.peek().value === '.') {
        this.advance();
        const prop = this.expect('Identifier');
        node = { kind: 'MemberExpression', object: node, property: prop.value };
      } else {
        break;
      }
    }

    return node;
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    if (token.type === 'Number') {
      this.advance();
      return { kind: 'NumberLiteral', value: parseFloat(token.value) };
    }

    if (token.type === 'String') {
      this.advance();
      return { kind: 'StringLiteral', value: token.value };
    }

    if (token.type === 'Boolean') {
      this.advance();
      return { kind: 'BooleanLiteral', value: token.value === 'true' };
    }

    if (token.type === 'Identifier') {
      this.advance();
      const name = token.value;

      // Check if this is a function call
      if (this.peek().type === 'Punctuation' && this.peek().value === '(') {
        this.advance(); // consume '('
        const args: ASTNode[] = [];
        if (!(this.peek().type === 'Punctuation' && this.peek().value === ')')) {
          args.push(this.parseExpression());
          while (this.peek().type === 'Punctuation' && this.peek().value === ',') {
            this.advance();
            args.push(this.parseExpression());
          }
        }
        this.expect('Punctuation', ')');
        return { kind: 'CallExpression', callee: name, args };
      }

      return { kind: 'Identifier', name };
    }

    if (token.type === 'Punctuation' && token.value === '(') {
      this.advance();
      const expr = this.parseExpression();
      this.expect('Punctuation', ')');
      return expr;
    }

    throw new Error(
      `Unexpected token '${token.value}' at position ${token.position}`
    );
  }
}

export function parse(input: string): ASTNode {
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  return parser.parse();
}
