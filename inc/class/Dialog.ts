class DialogBox {
    name: string = "Script";
    dialog: Dialog = new Dialog();

    constructor(name?: string, message?: string) {
        this.name = name ? name : this.name;
        const m = message ? message : "Message";
        this.dialog = app.dialogs.add({ name: this.name });
        this.dialog.dialogColumns.add({}).staticTexts.add({ staticLabel: m });
    }

    show(): boolean {
        return this.dialog.show();
    }
}
