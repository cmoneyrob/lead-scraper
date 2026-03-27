import type { ASTNode } from './types';

type Value = number | string | boolean | null | undefined;

type BuiltinFunction = (...args: Value[]) => Value;

const BUILTINS: Record<string, BuiltinFunction> = {
  len(val: Value): number {
    if (typeof val === 'string') return val.length;
    throw new Error(`len() expects a string, got ${typeof val}`);
  },
  lower(val: Value): string {
    if (typeof val === 'string') return val.toLowerCase();
    throw new Error(`lower() expects a string, got ${typeof val}`);
  },
  upper(val: Value): string {
    if (typeof val === 'string') return val.toUpperCase();
    throw new Error(`upper() expects a string, got ${typeof val}`);
  },
  includes(haystack: Value, needle: Value): boolean {
    if (typeof haystack === 'string' && typeof needle === 'string') {
      return haystack.includes(needle);
    }
    throw new Error(`includes() expects two strings, got ${typeof haystack} and ${typeof needle}`);
  },
  abs(val: Value): number {
    if (typeof val === 'number') return Math.abs(val);
    throw new Error(`abs() expects a number, got ${typeof val}`);
  },
  min(a: Value, b: Value): number {
    if (typeof a === 'number' && typeof b === 'number') return Math.min(a, b);
    throw new Error(`min() expects two numbers, got ${typeof a} and ${typeof b}`);
  },
  max(a: Value, b: Value): number {
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    throw new Error(`max() expects two numbers, got ${typeof a} and ${typeof b}`);
  },
};

function isTruthy(val: Value): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.length > 0;
  return Boolean(val);
}

function toNumber(val: Value): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'string') {
    const n = parseFloat(val);
    if (!isNaN(n)) return n;
  }
  return 0;
}

function resolveVariable(name: string, variables: Record<string, unknown>): Value {
  const parts = name.split('.');
  let current: unknown = variables;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  if (
    typeof current === 'number' ||
    typeof current === 'string' ||
    typeof current === 'boolean' ||
    current === null ||
    current === undefined
  ) {
    return current as Value;
  }

  return undefined;
}

function resolveMember(obj: Value, property: string, variables: Record<string, unknown>): Value {
  if (obj === null || obj === undefined) return undefined;

  // If obj is an identifier name stored as string, try resolving the full path
  // But typically member access is handled through the recursive evaluation
  // where the object is already resolved.
  // For primitive values, we don't support member access.
  return undefined;
}

function evaluateNode(node: ASTNode, variables: Record<string, unknown>): Value {
  switch (node.kind) {
    case 'NumberLiteral':
      return node.value;

    case 'StringLiteral':
      return node.value;

    case 'BooleanLiteral':
      return node.value;

    case 'Identifier':
      return resolveVariable(node.name, variables);

    case 'MemberExpression': {
      // Build full dotted path for deep variable resolution
      const path = buildMemberPath(node);
      if (path !== null) {
        return resolveVariable(path, variables);
      }
      // Fallback: evaluate object and access property
      const obj = evaluateNode(node.object, variables);
      return resolveMember(obj, node.property, variables);
    }

    case 'UnaryExpression': {
      const operand = evaluateNode(node.operand, variables);
      if (node.operator === '!') return !isTruthy(operand);
      if (node.operator === '-') return -toNumber(operand);
      throw new Error(`Unknown unary operator: ${node.operator}`);
    }

    case 'BinaryExpression': {
      const left = evaluateNode(node.left, variables);
      const right = evaluateNode(node.right, variables);

      switch (node.operator) {
        case '+':
          if (typeof left === 'string' || typeof right === 'string') {
            return String(left ?? '') + String(right ?? '');
          }
          return toNumber(left) + toNumber(right);
        case '-':
          return toNumber(left) - toNumber(right);
        case '*':
          return toNumber(left) * toNumber(right);
        case '/': {
          const divisor = toNumber(right);
          if (divisor === 0) throw new Error('Division by zero');
          return toNumber(left) / divisor;
        }
        case '>':
          return toNumber(left) > toNumber(right);
        case '<':
          return toNumber(left) < toNumber(right);
        case '>=':
          return toNumber(left) >= toNumber(right);
        case '<=':
          return toNumber(left) <= toNumber(right);
        case '==':
          return left === right;
        case '!=':
          return left !== right;
        case '&&':
          return isTruthy(left) && isTruthy(right);
        case '||':
          return isTruthy(left) || isTruthy(right);
      }
    }

    case 'TernaryExpression': {
      const condition = evaluateNode(node.condition, variables);
      return isTruthy(condition)
        ? evaluateNode(node.consequent, variables)
        : evaluateNode(node.alternate, variables);
    }

    case 'CallExpression': {
      const fn = BUILTINS[node.callee];
      if (!fn) throw new Error(`Unknown function: ${node.callee}`);
      const args = node.args.map((arg) => evaluateNode(arg, variables));
      return fn(...args);
    }

    default: {
      const exhaustive: never = node;
      throw new Error(`Unknown AST node kind: ${(exhaustive as ASTNode).kind}`);
    }
  }
}

function buildMemberPath(node: ASTNode): string | null {
  if (node.kind === 'Identifier') return node.name;
  if (node.kind === 'MemberExpression') {
    const objectPath = buildMemberPath(node.object);
    if (objectPath === null) return null;
    return `${objectPath}.${node.property}`;
  }
  return null;
}

export function evaluateExpression(
  node: ASTNode,
  variables: Record<string, unknown>
): number {
  const result = evaluateNode(node, variables);
  if (typeof result === 'number') return result;
  if (typeof result === 'boolean') return result ? 1 : 0;
  if (typeof result === 'string') {
    const n = parseFloat(result);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}
