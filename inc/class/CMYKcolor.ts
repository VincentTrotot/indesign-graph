class CMYKcolor {
    name: string = "Blanc";
    values: CMYK = [0, 0, 0, 0];
    swatch: Color = new Color();

    constructor(name?: string, values?: CMYK) {
        this.name = name ? name : this.name;
        this.values = values ? values : this.values;
        const col = app.documents[0].colors.item(this.name);

        try {
            this.swatch = col;
        } catch (myError) {
            this.swatch = app.documents[0].colors.add({
                name: this.name,
                colorValue: this.values,
            });
        }
    }
}

// Colors
var colors = [
    new CMYKcolor("Orange", [2, 38, 100, 0]),
    new CMYKcolor("Violet", [87, 67, 0, 37]),
    new CMYKcolor("Bleu 1", [70, 40, 0, 0]),
    new CMYKcolor("Bleu 2", [70, 40, 0, 31]),
    new CMYKcolor("Violet 1", [57, 89, 7, 0]),
    new CMYKcolor("Violet 2", [57, 89, 7, 51]),
    new CMYKcolor("Rouge 1", [4, 92, 80, 0]),
    new CMYKcolor("Rouge 2", [4, 92, 80, 39]),
    new CMYKcolor("Rose 1", [3, 83, 3, 0]),
    new CMYKcolor("Rose 2", [3, 83, 3, 25]),
    new CMYKcolor("Vert 1", [47, 0, 91, 0]),
    new CMYKcolor("Vert 2", [47, 0, 91, 31]),
    new CMYKcolor("Doré 1", [22, 36, 75, 0]),
    new CMYKcolor("Doré 2", [22, 48, 75, 35]),
];
shuffle(colors);
