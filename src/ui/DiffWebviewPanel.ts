import * as path from "path";
import * as vscode from "vscode";

import type { TaskDiff } from "code-sidecar-shared/types/diff";

const escapeJson = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, "\\u003c");

const buildTitle = (diff: TaskDiff): string => {
  const fileLabel = diff.summary.filesChanged === 1 ? "file" : "files";
  return `CodeSidecar Diff (${diff.summary.filesChanged} ${fileLabel})`;
};

interface DiffWebviewMessage {
  type: "open_file";
  path: string;
}

export class DiffWebviewPanel {
  private static currentPanel: DiffWebviewPanel | undefined;

  static show(diff: TaskDiff, filePath?: string): void {
    const column = vscode.ViewColumn.Active;

    if (DiffWebviewPanel.currentPanel) {
      DiffWebviewPanel.currentPanel.update(diff, filePath);
      DiffWebviewPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "codeSidecar.diffPreview",
      buildTitle(diff),
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    DiffWebviewPanel.currentPanel = new DiffWebviewPanel(panel, diff, filePath);
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    diff: TaskDiff,
    filePath?: string
  ) {
    this.panel.onDidDispose(() => {
      DiffWebviewPanel.currentPanel = undefined;
    });

    this.panel.webview.onDidReceiveMessage((message: DiffWebviewMessage) => {
      if (message?.type === "open_file") {
        void this.openDiffFile(message.path);
      }
    });

    this.update(diff, filePath);
  }

  private async openDiffFile(filePath: string): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    for (const folder of workspaceFolders) {
      const candidatePath = path.resolve(folder.uri.fsPath, filePath);
      try {
      const document = await vscode.workspace.openTextDocument(candidatePath);
      const targetColumn = this.panel.viewColumn ?? vscode.ViewColumn.Active;
      await vscode.window.showTextDocument(document, {
        preview: false,
        viewColumn: targetColumn,
      });
      return;
      } catch {
        // Try the next workspace folder.
      }
    }

    vscode.window.showWarningMessage(`Unable to open file: ${filePath}`);
  }

  private update(diff: TaskDiff, filePath?: string): void {
    this.panel.title = buildTitle(diff);
    this.panel.webview.html = this.render(diff, filePath);
  }

  private render(diff: TaskDiff, filePath?: string): string {
    const diffJson = escapeJson(diff);
    const filePathJson = escapeJson(filePath ?? "");

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${buildTitle(diff)}</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: var(--vscode-font-family);
        font-size: 13px;
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
      }
      .page {
        display: flex;
        flex-direction: column;
        height: 100vh;
        padding: 20px 24px;
        gap: 16px;
      }
      header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .title {
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-foreground);
      }
      .subtitle {
        margin-top: 4px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
      }
      .summary {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        text-align: right;
      }
      .layout {
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1;
        min-height: 0;
      }
      .diff-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: 0;
        overflow-y: auto;
        padding-right: 4px;
      }
      .file-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .file-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .file-info {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        background: transparent;
        border: none;
        padding: 0;
        text-align: left;
        cursor: pointer;
        color: inherit;
        font: inherit;
      }
      .file-info::before {
        content: "";
        width: 7px;
        height: 7px;
        border-right: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        transform: rotate(45deg);
        transition: transform 0.15s ease;
        opacity: 0.7;
        flex-shrink: 0;
      }
      .file-info[data-expanded="false"]::before {
        transform: rotate(-45deg);
      }
      .file-path {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 600;
        color: var(--vscode-foreground);
        flex: 1;
      }
      .file-delta {
        font-family: var(--vscode-editor-font-family);
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        flex-shrink: 0;
      }
      .file-open {
        background: transparent;
        border: none;
        padding: 4px 8px;
        border-radius: 6px;
        color: var(--vscode-textLink-foreground);
        font-size: 11px;
        cursor: pointer;
      }
      .file-open:hover {
        background: var(--vscode-list-hoverBackground);
      }
      .diff-table {
        background: var(--vscode-textCodeBlock-background);
        border-radius: 8px;
        padding-bottom: 8px;
        overflow-x: auto;
      }
      .diff-row {
        display: grid;
        grid-template-columns: 44px 44px 1fr;
        gap: 10px;
        padding: 2px 10px;
        font-family: var(--vscode-editor-font-family);
        font-size: 11px;
        line-height: 1.5;
      }
      .diff-row.header {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        padding-top: 6px;
        padding-bottom: 6px;
      }
      .diff-row.add {
        background: var(--vscode-diffEditor-insertedTextBackground);
        color: var(--vscode-diffEditor-insertedTextForeground);
      }
      .diff-row.remove {
        background: var(--vscode-diffEditor-removedTextBackground);
        color: var(--vscode-diffEditor-removedTextForeground);
      }
      .diff-row.context {
        color: var(--vscode-foreground);
      }
      .line-number {
        text-align: right;
        color: var(--vscode-descriptionForeground);
        font-size: 10px;
      }
      .line-content {
        white-space: pre;
        overflow-wrap: anywhere;
      }
      .empty {
        padding: 16px 12px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header>
        <div>
          <div class="title">Diff Preview</div>
          <div class="subtitle">Review changes from the last task run.</div>
        </div>
        <div class="summary" id="summary"></div>
      </header>
      <div class="layout">
        <section class="diff-list" id="diffList"></section>
      </div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      const diff = ${diffJson};
      const initialFilePath = ${filePathJson};
      const diffListEl = document.getElementById("diffList");
      const summaryEl = document.getElementById("summary");

      const files = Array.isArray(diff.files)
        ? diff.files.slice().sort((a, b) => a.path.localeCompare(b.path))
        : [];
      const hasInitial = initialFilePath && files.some((file) => file.path === initialFilePath);
      const initialExpanded = hasInitial
        ? [initialFilePath]
        : (files[0] ? [files[0].path] : []);
      const state = {
        expanded: new Set(initialExpanded),
      };

      const formatDelta = (file) => {
        const parts = [];
        if (file.added > 0) parts.push("+" + file.added);
        if (file.removed > 0) parts.push("-" + file.removed);
        return parts.length ? parts.join(" ") : "0";
      };

      const renderSummary = () => {
        if (!summaryEl) return;
        summaryEl.textContent = diff.summary
          ? diff.summary.filesChanged + " files · +" + diff.summary.linesAdded + " -" + diff.summary.linesRemoved
          : "";
      };

      const openFile = (filePath) => {
        if (!filePath) return;
        vscode.postMessage({ type: "open_file", path: filePath });
      };

      const toggleFile = (filePath) => {
        if (state.expanded.has(filePath)) {
          state.expanded.delete(filePath);
        } else {
          state.expanded.add(filePath);
        }
        render();
      };

      const renderDiffTable = (file) => {
        const table = document.createElement("div");
        table.className = "diff-table";

        const headerRow = document.createElement("div");
        headerRow.className = "diff-row header";

        const oldHeader = document.createElement("div");
        oldHeader.className = "line-number";
        oldHeader.textContent = "Old";

        const newHeader = document.createElement("div");
        newHeader.className = "line-number";
        newHeader.textContent = "New";

        const contentHeader = document.createElement("div");
        contentHeader.textContent = "Content";

        headerRow.appendChild(oldHeader);
        headerRow.appendChild(newHeader);
        headerRow.appendChild(contentHeader);
        table.appendChild(headerRow);

        if (!file || !Array.isArray(file.lines) || file.lines.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "No line-level changes to display.";
          table.appendChild(empty);
          return table;
        }

        const fragment = document.createDocumentFragment();
        file.lines.forEach((line) => {
          const row = document.createElement("div");
          row.className = "diff-row " + line.type;

          const oldNumber = document.createElement("div");
          oldNumber.className = "line-number";
          oldNumber.textContent = line.oldLineNumber ?? "";

          const newNumber = document.createElement("div");
          newNumber.className = "line-number";
          newNumber.textContent = line.newLineNumber ?? "";

          const content = document.createElement("div");
          content.className = "line-content";
          content.textContent = line.content || " ";

          row.appendChild(oldNumber);
          row.appendChild(newNumber);
          row.appendChild(content);
          fragment.appendChild(row);
        });

        table.appendChild(fragment);
        return table;
      };

      const renderDiffList = () => {
        if (!diffListEl) return;
        diffListEl.textContent = "";

        if (files.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "No changes to display.";
          diffListEl.appendChild(empty);
          return;
        }

        const fragment = document.createDocumentFragment();
        files.forEach((file) => {
          const section = document.createElement("section");
          section.className = "file-section";

          const header = document.createElement("div");
          header.className = "file-header";

          const infoButton = document.createElement("button");
          infoButton.type = "button";
          infoButton.className = "file-info";
          infoButton.dataset.expanded = String(state.expanded.has(file.path));
          infoButton.title = state.expanded.has(file.path)
            ? "Collapse changes"
            : "Expand changes";

          const pathSpan = document.createElement("span");
          pathSpan.className = "file-path";
          pathSpan.textContent = file.path;
          pathSpan.title = file.path;

          const deltaSpan = document.createElement("span");
          deltaSpan.className = "file-delta";
          deltaSpan.textContent = formatDelta(file);

          infoButton.appendChild(pathSpan);
          infoButton.appendChild(deltaSpan);
          infoButton.addEventListener("click", () => toggleFile(file.path));

          const openButton = document.createElement("button");
          openButton.type = "button";
          openButton.className = "file-open";
          openButton.textContent = "Open";
          openButton.title = "Open file";
          openButton.addEventListener("click", () => openFile(file.path));

          header.appendChild(infoButton);
          header.appendChild(openButton);
          section.appendChild(header);

          if (state.expanded.has(file.path)) {
            section.appendChild(renderDiffTable(file));
          }

          fragment.appendChild(section);
        });

        diffListEl.appendChild(fragment);
      };

      const render = () => {
        renderDiffList();
      };

      renderSummary();
      render();
    </script>
  </body>
</html>`;
  }
}
