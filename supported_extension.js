const programmingLanguages = {
  JavaScript: [".js"],
  TypeScript: [".ts"],
  Python: [".py"],
  Java: [".java"],
  CSharp: [".cs"],
  CPlusPlus: [".cpp"],
  PHP: [".php"],
  Ruby: [".rb"],
  Swift: [".swift"],
  Kotlin: [".kt"],
  Go: [".go"],
  Dart: [".dart"],
  HTML: [".html"],
  CSS: [".css", ".sass", ".less"],
  JSON: [".json"],
  YAML: [".yaml"],
  ShellScript: [".sh"],
  SQL: [".sql"],
  Markdown: [".md"],
  R: [".r"],
  Rust: [".rs"],
  Vue: [".vue"],
  React: [".jsx"],
  XML: [".xml"],
  GraphQL: [".graphql"],
  Perl: [".pl"],
  Groovy: [".groovy"],
  Assembly: [".asm"],
  CoffeeScript: [".coffee"],
  Batch: [".bat"],
  PowerShell: [".ps1"],
  ObjectiveC: [".m"],
  SwiftPackage: [".swift"],
  Django: [".django"],
  Handlebars: [".hbs"],
  Jinja: [".jinja"],
  EJS: [".ejs"],
  Haml: [".haml"],
  Stylus: [".styl"],
  FSharp: [".fs"],
  Lua: [".lua"],
  Terraform: [".tf"],
  Puppet: [".pp"],
};

const allFileExtensions = Array.from(
  new Set(
    Object.values(programmingLanguages).flatMap((extensions) => extensions)
  )
);

export { allFileExtensions };
