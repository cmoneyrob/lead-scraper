export type ASTNode =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | TernaryExpression
  | CallExpression
  | MemberExpression;

export interface NumberLiteral {
  kind: 'NumberLiteral';
  value: number;
}

export interface StringLiteral {
  kind: 'StringLiteral';
  value: string;
}

export interface BooleanLiteral {
  kind: 'BooleanLiteral';
  value: boolean;
}

export interface Identifier {
  kind: 'Identifier';
  name: string;
}

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '>'
  | '<'
  | '>='
  | '<='
  | '=='
  | '!='
  | '&&'
  | '||';

export interface BinaryExpression {
  kind: 'BinaryExpression';
  operator: BinaryOperator;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpression {
  kind: 'UnaryExpression';
  operator: '!' | '-';
  operand: ASTNode;
}

export interface TernaryExpression {
  kind: 'TernaryExpression';
  condition: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export interface CallExpression {
  kind: 'CallExpression';
  callee: string;
  args: ASTNode[];
}

export interface MemberExpression {
  kind: 'MemberExpression';
  object: ASTNode;
  property: string;
}

export type TokenType =
  | 'Number'
  | 'String'
  | 'Boolean'
  | 'Identifier'
  | 'Operator'
  | 'Punctuation'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}
