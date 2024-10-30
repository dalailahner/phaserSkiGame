import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  init(data) {
    this.productsAmount = data.productsAmount;
  }

  create() {
    // BG
    this.add.image(0, 0, "menuBG").setOrigin(0).setScale(0.5);

    // Text
    this.add
      .text(this.game.config.width >> 1, 75, "Main Menu", {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 72,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#006d9f",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    // Start Button
    const buttonStart = this.add.image(this.game.config.width >> 1, this.game.config.height * 0.66, "buttonStart").setScale(0.5);
    buttonStart.setInteractive({ useHandCursor: true });
    buttonStart.on("pointerdown", () => {
      this.scene.start("Game", { productsAmount: this.productsAmount });
    });
  }
}
