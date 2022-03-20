function main(): number {
    let camembert: Camembert;

    try {
        camembert = new Camembert();
    } catch (error: any) {
        alert(error.description);
        return 1;
    }

    //camembert.shout();
    camembert.draw();

    // const dialog = new DialogBox("Ma modale", "Salut");
    // if (dialog.show()) {
    //     alert("OK");
    // } else {
    //     alert("Annuler");
    // }

    return 0;
}
main();
