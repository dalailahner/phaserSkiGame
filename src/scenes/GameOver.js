import { Scene } from "phaser";

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }

  init(data) {
    this.score = data.score;
    this.gameOverTextConf = {
      fontFamily: "'Open Sans', sans-serif",
      fontSize: 72,
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#006d9f",
      strokeThickness: 8,
      align: "center",
    };
  }

  create() {
    // BG
    this.cameras.main.setBackgroundColor(this.game.config.backgroundColor);
    this.add.image(0, 0, "menuBG").setOrigin(0).setScale(0.5);

    // Headline
    this.add.text(this.game.config.width >> 1, 75, "Game Over", this.gameOverTextConf).setOrigin(0.5);

    // Score
    this.scoreText = this.add.text(this.game.config.width >> 1, 310, "Punkte: 0", this.gameOverTextConf).setOrigin(0.5);

    //   count up the score
    this.tweens.addCounter({
      from: 0,
      to: this.score,
      duration: 2000,
      delay: 100,
      ease: "Expo.out",
      onUpdate: (tween) => {
        const value = Math.round(tween.getValue());
        this.scoreText.setText(`Punkte: ${value}`);
      },
    });

    // Button
    const restartBtn = this.add
      .sprite(this.game.config.width >> 1, this.game.config.height * 0.75, "buttonRestart", 0)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true });

    //   events
    restartBtn.on("pointerover", () => {
      restartBtn.setFrame(1);
      this.tweens.add({
        targets: restartBtn,
        scale: 0.52,
        duration: 150,
        ease: "Expo.out",
      });
    });
    restartBtn.on("pointerout", () => {
      restartBtn.setFrame(0);
      this.tweens.add({
        targets: restartBtn,
        scale: 0.5,
        duration: 150,
        ease: "Expo.out",
      });
    });
    restartBtn.on("pointerdown", () => {
      this.tweens.killAll();
      this.game.events.removeAllListeners();
      this.scene.start("MainMenu", { productsAmount: this.productsAmount });
    });
  }
}
