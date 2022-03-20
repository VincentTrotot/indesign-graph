class Camembert {
    data: Data[] = [];
    total: number = 0;
    layer: Layer = app.activeDocument.activeLayer as Layer;
    bounds: [Point, Point] = [
        { x: 0, y: 0 },
        { x: 25, y: 25 },
    ];
    circle: Circle = {
        center: { x: 0, y: 0 },
        radius: 25,
    };

    constructor() {
        // Si aucun document n'est ouvert
        if (app.documents.length == 0) {
            throw new Error("Erreur\nVous devez avoir un document ouvert");
        }

        // Si le document ne contient pas de bloc paragraphe
        if (app.activeDocument.stories.length == 0) {
            throw new Error(
                "Erreur\nLe document doit contenir au moins un bloc de texte."
            );
        }

        let selection = app.selection as any[];

        // Si rien n'est sélectionné
        if (selection.length === 0) {
            throw new Error(
                "Erreur\nVous devez sélectionner du texte ou un bloc paragraphe."
            );
        }

        // Si plusieurs blocs sont sélectionnés
        if (selection.length > 1) {
            throw new Error(
                "Erreur\nVous ne devez sélectionner qu'un bloc paragraphe."
            );
        }

        let table = selection[0].tables as Table[];
        if (table.length > 0) {
            this.dataFromTable(table[0]);
        } else {
            this.dataFromString(selection[0].contents as string);
        }
        this.calcPercent();
        this.calcBounds();
        this.calcCirclePosition();
        this.calcSlicesPaths();
    }

    dataFromTable(table: Table): void {
        this.data = [];

        for (let i = 0; i < table.rows.length; i++) {
            const value = table.columns[1].cells[i].contents as string;
            const label = table.columns[0].cells[i].contents as string;
            const d = parseFloat(value.replace(",", "."));
            this.data.push({
                value: d,
                label: label,
                percent: 0,
            });
            this.total += d;
        }
    }

    dataFromString(string: string): void {
        let content = string.split(/[^\d\.,]/ as any);
        this.total = 0;
        this.data = [];

        // Récupération des nombres uniquements
        for (let i = 0; i < content.length; i++) {
            const d = parseFloat(content[i].replace(",", "."));
            if (!isNaN(d)) {
                this.data.push({
                    value: d,
                    label: d.toString(),
                    percent: 0,
                });
                this.total += d;
            }
        }
    }

    calcPercent(): void {
        // Calcul des pourcentages
        for (let i = 0; i < this.data.length; i++) {
            this.data[i].percent = (this.data[i].value / this.total) * 100;
        }
    }

    calcBounds(): void {
        const pageWidth = app.activeDocument.documentPreferences
            .pageWidth as number;
        const selection = app.selection as any;

        const x1 = pageWidth / 2 - this.circle.radius;
        const y1 = Math.floor(selection[0].geometricBounds[2]) + 20;
        const x2 = x1 + this.circle.radius * 2;
        const y2 = y1 + this.circle.radius * 2;

        this.bounds[0] = { x: x1, y: y1 };
        this.bounds[1] = { x: x2, y: y2 };

        let res = "Bounds\n";
        res += this.bounds[0].x + ", " + this.bounds[0].y + "\n";
        res += this.bounds[1].x + ", " + this.bounds[1].y + "\n";
        //alert(res);
    }

    calcCirclePosition() {
        this.circle.center.x = (this.bounds[0].x + this.bounds[1].x) / 2;
        this.circle.center.y = (this.bounds[0].y + this.bounds[1].y) / 2;
    }

    calcSlicesPaths() {
        // angle sert à gerer le pas entre chaque point des polygones
        let angle = -Math.PI / 2;
        let previousAngle = angle;
        const step = (2 * Math.PI) / 360;

        // Traçage des polygones
        for (let i = 0; i < this.data.length; i++) {
            //L'angle qu'on veut atteindre
            const goalAngle =
                previousAngle + (this.data[i].percent * 2 * Math.PI) / 100;

            const labelAngle =
                previousAngle + (this.data[i].percent * 2 * Math.PI) / 100 / 2;

            this.data[i].labelBounds = [
                {
                    x:
                        this.circle.center.x +
                        (this.circle.radius + 2) * Math.cos(labelAngle),
                    y:
                        this.circle.center.y +
                        (this.circle.radius + 2) * Math.sin(labelAngle),
                },
                {
                    x:
                        this.circle.center.x +
                        (this.circle.radius + 5) * Math.cos(labelAngle),
                    y:
                        this.circle.center.y +
                        (this.circle.radius + 5) * Math.sin(labelAngle),
                },
            ];

            // le premier point du polygone à être sur le cercle
            let x =
                this.circle.center.x +
                this.circle.radius * Math.cos(previousAngle);
            let y =
                this.circle.center.y +
                this.circle.radius * Math.sin(previousAngle);

            // le tableau de coordonées du polygone,
            // commençant par le centre du cercle et le premier point
            const slicePath = [
                {
                    x: this.circle.center.x,
                    y: this.circle.center.y,
                },
                {
                    x: x,
                    y: y,
                },
            ];

            // tant que l'angle est plus petit que l'angle à atteindre,
            // on ajoute les points dans le tableau des coordonées du polygone
            do {
                x = this.circle.center.x + this.circle.radius * Math.cos(angle);
                y = this.circle.center.y + this.circle.radius * Math.sin(angle);
                slicePath.push({ x: x, y: y });
                angle += step;
            } while (angle < goalAngle);

            // Le dernier point à être ajouter est le point du goal
            x = this.circle.center.x + this.circle.radius * Math.cos(goalAngle);
            y = this.circle.center.y + this.circle.radius * Math.sin(goalAngle);
            slicePath.push({ x: x, y: y });

            // On sauvegarde le dernier point, qui devient le premier point
            // du prochain polygone
            previousAngle = goalAngle;

            // On ajoute le polygone au tableau de résultat
            this.data[i].slicePath = slicePath;
        }
    }

    draw() {
        const graphics = [];
        // Chaque tranche du camembert
        for (let i = 0; i < this.data.length; i++) {
            const graphicPolygon = app.documents[0].pages
                .item(0)
                .polygons.add(this.layer);
            let entirePath = [];

            for (let j = 0; j < this.data[i].slicePath!.length; j++) {
                entirePath.push([
                    this.data[i].slicePath![j].x,
                    this.data[i].slicePath![j].y,
                ]);
            }
            graphicPolygon.paths[0].entirePath = entirePath;

            graphicPolygon.strokeWeight = 1;
            graphicPolygon.fillColor = colors[i % colors.length].swatch;
            graphicPolygon.strokeColor = new CMYKcolor().swatch;
            graphicPolygon.name = this.data[i].label;
            graphics.push(graphicPolygon);
        }

        // Le cercle de devant, avec un fond blanc
        // qui masque le centre du camembert
        const foregroundCircle = app.documents[0].pages
            .item(0)
            .ovals.add(this.layer);
        const foregroundCircleRatio = this.circle.radius / 2;
        foregroundCircle.geometricBounds = [
            this.bounds[0].y + foregroundCircleRatio,
            this.bounds[0].x + foregroundCircleRatio,
            this.bounds[1].y - foregroundCircleRatio,
            this.bounds[1].x - foregroundCircleRatio,
        ];
        foregroundCircle.strokeWeight = 1;
        foregroundCircle.fillColor = new CMYKcolor().swatch;
        foregroundCircle.strokeColor = new CMYKcolor().swatch;

        graphics.push(foregroundCircle);
        const group = app.documents[0].pages
            .item(0)
            .groups.add(graphics, this.layer);
        group.name = "Tranches";

        this.addLabels();
        const labelsGroup = app.documents[0].pages
            .item(0)
            .groups.itemByName("Labels");

        const superGroup = app.documents[0].pages
            .item(0)
            .groups.add([group, labelsGroup], this.layer);
        superGroup.name = "Camembert";
    }

    addLabels() {
        const graphics = [];
        for (let i = 0; i < this.data.length; i++) {
            const pt1 = {
                x: this.data[i].labelBounds![0].x,
                y: this.data[i].labelBounds![0].y,
            };
            const pt2 = {
                x: this.data[i].labelBounds![1].x,
                y: this.data[i].labelBounds![1].y,
            };
            const pt3 = {
                x: pt2.x > this.circle.center.x ? pt2.x + 40 : pt2.x - 40,
                y: pt2.y,
            };
            const graphicLine = app.documents[0].pages
                .item(0)
                .graphicLines.add(this.layer);
            graphicLine.paths[0].entirePath = [
                [pt1.x, pt1.y],
                [pt2.x, pt2.y],
                [pt3.x, pt3.y],
            ];
            graphicLine.strokeWeight = 0.5;
            graphicLine.strokeColor = new CMYKcolor(
                "Black",
                [0, 0, 0, 100]
            ).swatch;
            graphics.push(graphicLine);

            const myTextFrame = app.documents[0].pages
                .item(0)
                .textFrames.add(this.layer);
            myTextFrame.textFramePreferences.verticalJustification =
                VerticalJustification.BOTTOM_ALIGN;
            myTextFrame.geometricBounds = [pt3.y - 12, pt3.x, pt2.y - 2, pt2.x];
            myTextFrame.texts.item(0).insertionPoints.item(0).contents =
                this.data[i].label.toString();
            if (pt2.x > this.circle.center.x)
                myTextFrame.parentStory.justification =
                    Justification.RIGHT_ALIGN;
            graphics.push(myTextFrame);
        }
        const group = app.documents[0].pages
            .item(0)
            .groups.add(graphics, this.layer);
        group.name = "Labels";
    }

    shout(): void {
        let res: string = "Contenu du camembert\n";
        for (let i = 0; i < this.data.length; i++) {
            res +=
                i +
                1 +
                " : " +
                this.data[i].label +
                " => " +
                this.data[i].value +
                "\n";
        }
        alert(res);
    }
}
