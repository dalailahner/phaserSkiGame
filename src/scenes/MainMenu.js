import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  init(data) {
    this.productsAmount = data.productsAmount;
    this.isTouchDevice = false;
    this.hoverBtns = [];
    window.addEventListener("touchstart", () => {
      this.isTouchDevice = true;
    });
    screen.orientation.addEventListener("change", () => this.game.scale.refresh());
  }

  create() {
    // BG
    this.add.image(0, 0, "menuBG").setOrigin(0).setScale(0.5);

    // HEADLINE
    //   Logo
    this.add
      .image(this.game.config.width * 0.2, this.game.config.height * 0.1, "ikoLogo")
      .setOrigin(0.5)
      .setScale(0.5);
    //   Text
    const headline = this.add
      // leave the space, idk why but it's rendering weird without
      .text(this.game.config.width * 0.55, 75, " Jubiläumsrennen", {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 60,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#014694",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    // SUBLINE
    const subline1 = this.add
      .text(110, this.game.config.height * 0.35, "Schnell fahren, Punkte sammeln, gewinnen!", {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 36,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#014694",
        strokeThickness: 7,
        align: "left",
      })
      .setOrigin(0, 0.5);
    const subline2 = this.add
      .text(this.game.config.width >> 1, this.game.config.height * 0.5, "Tipp: Je schneller du fährst, desto mehr Punkte kannst du holen. Nur wer sicher ins Ziel kommt und gleichzeitig die meisten Punkte sammelt, kann gewinnen!", {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 28,
        fontStyle: "bold italic",
        color: "#ffffff",
        stroke: "#014694",
        strokeThickness: 6,
        align: "left",
        wordWrap: { width: this.game.config.width * 0.8, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    // BUTTONS & UI
    const buttonFullscreen = this.add
      .sprite(this.game.config.width - 100, 80, "buttonFullscreen", 0)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true });

    const buttonStart = this.add
      .sprite(this.game.config.width * 0.72, this.game.config.height * 0.8, "buttonStart", 0)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true });

    const buttonControls = this.add
      .sprite(this.game.config.width * 0.28, this.game.config.height * 0.8, "buttonControls", 0)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true });
    const howToPlay = this.add
      .sprite(this.game.config.width >> 1, this.game.config.height, "howToPlay", 0)
      .setOrigin(0.5, 0)
      .setVisible(false);
    const buttonCloseControls = this.add
      .sprite(this.game.config.width + 100, this.game.config.height * 0.4, "buttonClose", 0)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    //   hover
    this.hoverBtns = [buttonFullscreen, buttonStart, buttonControls, buttonCloseControls];
    this.hoverBtns.forEach((btn) => {
      btn.on("pointerover", () => {
        btn.setFrame(1);
        this.tweens.add({
          targets: btn,
          scale: 0.52,
          duration: 150,
          ease: "Expo.out",
        });
      });
      btn.on("pointerout", () => {
        btn.setFrame(0);
        this.tweens.add({
          targets: btn,
          scale: 0.5,
          duration: 150,
          ease: "Expo.out",
        });
      });
    });

    // ORIENTATION CHECK
    this.overlay = this.add.graphics();
    this.overlay.setDepth(90);
    this.overlay.fillStyle(0x000000, 0.8);
    this.overlay.fillRect(0, 0, this.game.config.width, this.game.config.height);
    this.orientationText = this.add
      .text(this.game.config.width >> 1, this.game.config.height * 0.4, "Drehe das Gerät\nfür ein besseres\nSpielerlebnis.", {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 72,
        fontStyle: "bold",
        color: "#f5f5f5",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(91);
    this.closeOverlayText = this.add
      .text(this.game.config.width >> 1, this.game.config.height * 0.75, "[schließen]", {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 41,
        color: "#f5f5f5",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(92);
    this.checkOriention();
    this.scale.on("orientationchange", this.checkOriention, this);

    // EVENTS
    //   toggle fullscreen
    buttonFullscreen.on("pointerdown", () => {
      this.scale.toggleFullscreen();
    });
    //   show controls
    buttonControls.on("pointerdown", () => {
      setTimeout(() => {
        howToPlay.setFrame(this.isTouchDevice ? 1 : 0);
      }, 1);

      [subline1, subline2, buttonStart, buttonControls].forEach((btn) => {
        btn.setVisible(false);
      });
      [howToPlay, buttonCloseControls].forEach((btn) => {
        btn.setVisible(true);
      });

      this.tweens.add({
        targets: howToPlay,
        y: this.game.config.height - howToPlay.displayHeight,
        duration: 800,
        ease: "Sine.inOut",
      });
      this.tweens.add({
        targets: buttonCloseControls,
        x: this.game.config.width - 100,
        delay: 250,
        duration: 800,
        ease: "Sine.inOut",
      });
      headline.setText("Steuerung");
    });
    //   hide controls
    buttonCloseControls.on("pointerdown", () => {
      [howToPlay, buttonCloseControls].forEach((btn) => {
        btn.setVisible(false);
      });
      [subline1, subline2, buttonStart, buttonControls].forEach((btn) => {
        btn.setVisible(true);
      });
      howToPlay.setPosition(this.game.config.width >> 1, this.game.config.height);
      buttonCloseControls.setPosition(this.game.config.width + 100, this.game.config.height * 0.4);
      headline.setText("iko Gewinnspiel");
    });
    //   start game
    buttonStart.on("pointerdown", () => {
      this.tweens.killAll();
      this.game.events.removeAllListeners();
      setTimeout(() => {
        this.scene.start("Game", { productsAmount: this.productsAmount, isTouchDevice: this.isTouchDevice });
      }, 1);
    });
    //   hide OrientationOverlay
    this.closeOverlayText.on("pointerdown", () => {
      this.showOrientationOverlay(false);
    });
  }

  checkOriention() {
    if (this.scale.isPortrait) {
      this.showOrientationOverlay(true);
      return;
    }
    this.showOrientationOverlay(false);
  }

  showOrientationOverlay(bool = true) {
    if (bool) {
      this.hoverBtns.forEach((btn) => {
        btn.disableInteractive();
      });
      this.overlay.setVisible(true);
      this.orientationText.setVisible(true);
      this.closeOverlayText.setVisible(true);
      this.closeOverlayText.setInteractive({ useHandCursor: true });
      return;
    }
    if (!bool) {
      this.hoverBtns.forEach((btn) => {
        btn.setInteractive({ useHandCursor: true });
      });
      this.overlay.setVisible(false);
      this.orientationText.setVisible(false);
      this.closeOverlayText.setVisible(false);
      this.closeOverlayText.disableInteractive();
      return;
    }
    console.log("Bool is not a boolean:", bool);
  }
}
