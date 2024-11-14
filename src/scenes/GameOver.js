import { Scene } from "phaser";
import CryptoJS from "crypto-js";

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }

  init(data) {
    this.productsAmount = data.productsAmount;
    this.score = data.score;

    screen.orientation.addEventListener("change", () => this.game.scale.refresh());

    this.gameOverTextConf = {
      fontFamily: "'Open Sans', sans-serif",
      fontSize: 72,
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#014694",
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

    // Buttons
    //   restart btn
    const restartBtn = this.add
      .sprite(this.game.config.width * 0.28, this.game.config.height * 0.8, "buttonRestart", 0)
      .setScale(0.33)
      .setInteractive({ useHandCursor: true });

    //   enter raffle btn
    const buttonEnterRaffle = this.add
      .sprite(this.game.config.width * 0.72, this.game.config.height * 0.8, "buttonEnterRaffle", 0)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);
    //     fx
    const buttonEnterRaffleGlow = buttonEnterRaffle.preFX.addGlow(0xf2c668, 4, 2);
    buttonEnterRaffle.preFX.setPadding(32);

    //   anims & events
    restartBtn.on("pointerover", () => {
      restartBtn.setFrame(1);
      this.tweens.add({
        targets: restartBtn,
        scale: 0.3,
        duration: 150,
        ease: "Expo.out",
      });
    });
    restartBtn.on("pointerout", () => {
      restartBtn.setFrame(0);
      this.tweens.add({
        targets: restartBtn,
        scale: 0.33,
        duration: 150,
        ease: "Expo.out",
      });
    });
    restartBtn.on("pointerdown", () => {
      this.tweens.killAll();
      this.game.events.removeAllListeners();
      this.scene.start("MainMenu", { productsAmount: this.productsAmount });
    });

    this.tweens.add({
      targets: buttonEnterRaffleGlow,
      outerStrength: 32,
      yoyo: true,
      repeat: -1,
      duration: 800,
    });
    buttonEnterRaffle.on("pointerover", () => {
      buttonEnterRaffle.setFrame(1);
      this.tweens.add({
        targets: buttonEnterRaffle,
        scale: 1.1,
        duration: 150,
        ease: "Expo.out",
      });
    });
    buttonEnterRaffle.on("pointerout", () => {
      buttonEnterRaffle.setFrame(0);
      this.tweens.add({
        targets: buttonEnterRaffle,
        scale: 1,
        duration: 150,
        ease: "Expo.out",
      });
    });
    buttonEnterRaffle.on("pointerdown", () => {
      const obfuscatedScore = CryptoJS.AES.encrypt(`${this.score}`, "Vqh8avxksB").toString();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      }
      const raffleLink = document.createElement("a");
      raffleLink.href = `https://forms.sn.at/iko-gewinnspiel/?score=${encodeURIComponent(obfuscatedScore)}`;
      raffleLink.target = "_top";
      raffleLink.style.opacity = "0";
      raffleLink.style.position = "absolute";
      document.body.appendChild(raffleLink);
      raffleLink.click();
    });
  }
}
