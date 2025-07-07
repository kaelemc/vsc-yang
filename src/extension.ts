import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const keywords = [
    'module', 'container', 'leaf', 'leaf-list', 'list',
    'type', 'description', 'default', 'enum', 'config',
    'mandatory', 'presence', 'uses', 'augment', 'import',
    'revision', 'grouping', 'namespace', 'prefix'
  ];

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'yang',
    {
      provideCompletionItems(document, position, token, context) {
        const completions: vscode.CompletionItem[] = [];

        const textBeforeCursor = document.getText(new vscode.Range(
          new vscode.Position(0, 0),
          position
        ));

        const lines = textBeforeCursor.split(/\r?\n/);

        const declaredPrefixes = new Set<string>();
        const declaredModules = new Set<string>();

        for (const line of lines) {
          const trimmed = line.trim();

          const prefixMatch = trimmed.match(/^prefix\s+([a-zA-Z0-9\-_]+)\s*;/);
          if (prefixMatch) declaredPrefixes.add(prefixMatch[1]);

          const importMatch = trimmed.match(/^import\s+([a-zA-Z0-9\-_]+)\s*;/);
          if (importMatch) declaredModules.add(importMatch[1]);
        }

        // Core YANG keywords
        for (const keyword of keywords) {
          const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
          item.detail = 'YANG Syntax hint';
          completions.push(item);
        }

        // Imported module names (for auto-completing after 'import ')
        for (const mod of declaredModules) {
          const item = new vscode.CompletionItem(mod, vscode.CompletionItemKind.Module);
          item.detail = 'YANG: Imported Module';
          completions.push(item);
        }

        // Prefixes in scope
        for (const prefix of declaredPrefixes) {
          const item = new vscode.CompletionItem(prefix + ':', vscode.CompletionItemKind.Reference);
          item.detail = 'YANG: Prefix';
          completions.push(item);
        }

        return completions;
      }
    },
    ':', ' ', '\n'
  );

  // formatter
  const formatter = vscode.languages.registerDocumentFormattingEditProvider('yang', {
      provideDocumentFormattingEdits(document) {
        const edits: vscode.TextEdit[] = [];

        let indentLevel = 0;
        for (let i = 0; i < document.lineCount; i++) {
          const line = document.lineAt(i);
          const text = line.text.trim();

          if (text.startsWith('}')) {
            indentLevel = Math.max(indentLevel - 1, 0);
          }

          const desiredIndent = '  '.repeat(indentLevel); // 2-space indent
          const currentIndent = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);

          if (currentIndent !== desiredIndent && text.length > 0) {
            edits.push(
              vscode.TextEdit.replace(
                new vscode.Range(i, 0, i, line.firstNonWhitespaceCharacterIndex),
                desiredIndent
              )
            );
          }

          if (text.endsWith('{')) {
            indentLevel++;
          }
        }

        return edits;
      }
    });

  context.subscriptions.push(completionProvider);
  context.subscriptions.push(formatter)
    
}

export function deactivate() {}
