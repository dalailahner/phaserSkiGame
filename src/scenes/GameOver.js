import { Scene } from "phaser";

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }

  init(data) {
    this.score = data.score;
  }

  create() {
    // BG
    this.cameras.main.setBackgroundColor(this.game.config.backgroundColor);
    this.add.image(0, 0, "menuBG").setOrigin(0).setScale(0.5);

    // Text
    this.add
      .text(this.game.config.width >> 1, 75, "Game Over", {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 72,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#006d9f",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.scoreText = this.add
      .text(this.game.config.width >> 1, 350, "Your Score: 0", {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 48,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5);

    // count up the score
    this.tweens.addCounter({
      from: 0,
      to: this.score,
      duration: 2000,
      delay: 100,
      ease: "Expo.out",
      onUpdate: (tween) => {
        const value = Math.round(tween.getValue());
        this.scoreText.setText(`Your Score: ${value}`);
      },
    });
  }
}
