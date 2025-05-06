// Token类型
const TokenType = {
  IDENTIFIER: "IDENTIFIER", // 标识符
  STRING: "STRING", // 字符
  CALL: "CALLEXPRESSION", // 函数调用
  PROPERTY: "PROPERTY", // 属性读取
};

// 词法分析器
function lexer(input) {
  const tokens = [];
  let current = 0;

  while (current < input.length) {
    let char = input[current];

    if (char === "(" || char === ")") {
      tokens.push({
        type: TokenType.CALL,
        value: char,
      });
      current++;
      continue;
    }
    if (char === "." || char === "[" || char === "]") {
      tokens.push({
        type: TokenType.PROPERTY,
        value: char,
      });
      current++;
      continue;
    }
    if (char === '"') {
      let value = "";
      char = input[++current];
      while (char !== '"') {
        value += char;
        char = input[++current];
      }
      tokens.push({
        type: TokenType.STRING,
        value,
      });
      current++;
      continue;
    }
    if (/[a-zA-Z]/.test(char)) {
      let value = "";

      while (/[a-zA-Z]/.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({
        type: TokenType.IDENTIFIER,
        value,
      });
      continue;
    }
    current++;
  }

  return tokens;
}

// 语法分析器
function parser(tokens) {
  let current = 0;
  const ast = { body: [] };
  function walk() {
    let token = tokens[current];
    if (token.type === TokenType.STRING) {
      current++;
      return {
        type: "StringLiteral",
        value: token.value,
      };
    }

    if (token.type === TokenType.IDENTIFIER) {
      current++;
      let nextToken = tokens[current];
      if (nextToken && nextToken.type === TokenType.PROPERTY) {
        current++;
        return {
          type: "Identifier",
          name: token.value,
          property: walk(),
        };
      }

      if (
        nextToken &&
        nextToken.type === TokenType.CALL &&
        nextToken.value === "("
      ) {
        function getFunctionCallNode() {
          const node = {
            type: "CallExpression",
            name: token.value,
            params: [],
          };
          token = tokens[++current];
          while (
            !(token && token.type === TokenType.CALL && token.value === ")")
          ) {
            node.params.push(walk());
            token = tokens[current];
          }
          nextToken = tokens[current + 1];
          if (
            nextToken &&
            nextToken.type === TokenType.CALL &&
            nextToken.value === "("
          ) {
            current++;
            node.child = {
              ...getFunctionCallNode(),
              name: undefined,
            };
          }
          return node;
        }
        const node = getFunctionCallNode();
        return node;
      }
      return {
        type: "Identifier",
        name: token.value,
      };
    }
    current++;
    return null;
  }
  while (current < tokens.length) {
    const node = walk();
    if (node) {
      ast.body.push(node);
    }
  }
  return ast;
}

// 解释执行器`
function interpreter(ast, scope) {
  for (let i = 0; i < ast.body.length; i++) {
    const node = ast.body[i];
    recursion(node, scope);
  }

  function recursion(node, innerScope, returnFn) {
    switch (node.type) {
      case "CallExpression":
        const params = node.params.map((param) => {
          return recursion(param, innerScope);
        });
        const fn = node.name ? innerScope[node.name] : returnFn;
        const returnValue = fn?.(...params);
        if (node.child) {
          return recursion(node.child, innerScope, returnValue);
        }
        break;
      case "StringLiteral":
        return node.value;
      case "Identifier":
        if (node.property) {
          return recursion(node.property, innerScope[node.name]);
        }
        return innerScope[node.name];
    }
  }
}

// 执行编译器
function compiler(input) {
  const tokens = lexer(input);
  const ast = parser(tokens);
  interpreter(ast, {
    myConsole: {
      log: (...params) => {
        console.log(...params);
        console.log("执行打印结束");
        return () => {
          console.log("console log return function===>> test 连续调用");
          return () => {
            console.log("===>> 第三次调用");
          };
        };
      },
    },
    testLog: console.log,
    globalValue: "==> hello word4",
  });
}

// 测试代码
const code =
  'myConsole.log("hello world")()();myConsole.log("hello world2");testLog("hello word3");testLog(globalValue)';
compiler(code);
