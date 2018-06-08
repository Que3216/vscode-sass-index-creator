import { existsSync, lstatSync, readdirSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { Disposable, ExtensionContext, window, workspace } from 'vscode';

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(ctx: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('index.scss creator is now active');

    const templater = new Templater();
    const controller = new TemplaterController(templater);

    ctx.subscriptions.push(controller);
    ctx.subscriptions.push(templater);
}

export class Templater {
    public fillOutTemplateIfEmpty() {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        const doc = editor.document;

        if (doc.getText().length !== 0) {
            return;
        }

        const isSass = doc.languageId === "scss";

        if (!isSass) {
            return;
        }

        const fileName = basename(doc.fileName, extname(doc.fileName));

        if (fileName !== "index") {
            return;
        }

        const currentDirectory = dirname(doc.fileName);

        const directoriesAndFiles = readdirSync(currentDirectory);
        const fileContents: string[] = [];

        directoriesAndFiles.forEach(directoryOrFile => {
            if (directoryOrFile === basename(doc.fileName)) {
                return; // Skip ourself
            }
            const path = join(currentDirectory, directoryOrFile);
            if (lstatSync(path).isDirectory()) {
                if (this.containsSassIndexFileSync(path)) {
                    fileContents.push(`@import "${directoryOrFile}";`);
                }
            } else if (directoryOrFile.endsWith(".scss") || directoryOrFile.endsWith(".sass")) {
                const sassFileName = basename(path, extname(path));
                fileContents.push(`@import "${sassFileName}";`);
            }
        });

        // Add a new line at the end
        fileContents.push("");

        editor.edit(builder => {
            builder.insert(doc.positionAt(0), fileContents.join("\n"));
        });
    }

    private containsSassIndexFileSync(directory: string) {
        return existsSync(join(directory, "index.scss")) || existsSync(join(directory, "index.sass"));
    }

    public dispose() {
    }
}

class TemplaterController {

    private _templater: Templater;
    private _disposable: Disposable;

    constructor(templater: Templater) {
        this._templater = templater;

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        workspace.onDidOpenTextDocument(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._templater.fillOutTemplateIfEmpty();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
