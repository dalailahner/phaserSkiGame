import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
    this.productsAmount = 18;
  }

  init() {
    // We loaded this image in our Boot Scene, so we can display it here
    this.add.image(0, 0, "menuBG").setOrigin(0).setScale(0.5);

    //---------------
    // Progress Bar:
    //   container
    this.progressBarCont = this.add.container(this.game.config.width / 2 - 481 / 2, this.game.config.height * 0.7);
    //   BG
    this.progressBarCont.add(this.add.rectangle(17, 39, 481, 51, 0x92cde8).setOrigin(0));
    //   This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const progressBar = this.add.rectangle(17, 39, 4, 51, 0xffc83c).setOrigin(0);
    this.progressBarCont.add(progressBar);
    //   overlay
    this.progressBarCont.add(this.add.image(0, 0, "progressBarOverlay").setOrigin(0).setScale(0.5));
    //   progress event
    this.load.on("progress", (progress) => {
      progressBar.width = 4 + 477 * progress;
    });
  }

  preload() {
    // set base path
    this.load.setPath("assets");

    // Main Menu
    this.load.spritesheet("buttonFullscreen", "buttonFullscreen.png", {
      frameWidth: 270,
      frameHeight: 260,
    });
    this.load.spritesheet("buttonStart", "buttonStart.png", {
      frameWidth: 984,
      frameHeight: 506,
    });
    this.load.spritesheet("buttonControls", "buttonControls.png", {
      frameWidth: 984,
      frameHeight: 506,
    });
    this.load.spritesheet("howToPlay", "howToPlay.png", {
      frameWidth: 2048,
      frameHeight: 986,
    });
    this.load.spritesheet("buttonClose", "buttonClose.png", {
      frameWidth: 270,
      frameHeight: 260,
    });

    // Background
    this.load.image("sky", "sky.jpg");
    this.load.image("mountainsBack", "mountainsBack.png");
    this.load.image("mountainsFront", "mountainsFront.png");
    this.load.image("trees", "trees.png");

    // Floor
    this.load.image("taferl", "taferl.png");
    this.load.image("floorSnow1", "floorSnow1.png");
    this.load.image("floorSnow2", "floorSnow2.png");
    this.load.image("floorSnow3", "floorSnow3.png");

    // Mandal
    this.load.image("arm", "arm.png");
    this.load.image("torso", "torso.png");
    this.load.image("head", "head.png");
    this.load.image("thighs", "thighs.png");
    this.load.image("calfs", "calfs.png");
    this.load.image("ski", "ski.png");

    this.load.json("mandalShape", "mandal.json");

    // Score Sign
    this.load.image("scoreSign", "scoreSign.png");

    // Touch Controls
    this.load.spritesheet("touchControlsLeft", "touchControlsLeft.png", {
      frameWidth: 400,
      frameHeight: 250,
    });
    this.load.spritesheet("touchControlsRight", "touchControlsRight.png", {
      frameWidth: 250,
      frameHeight: 400,
    });

    // Products
    for (let i = 1; i <= this.productsAmount; i++) {
      this.load.image(`product${i}`, `product${i}.png`);
    }

    // ikoHaus
    this.load.image("ikoHaus1", "ikoHaus1.png");
    this.load.image("ikoHaus2", "ikoHaus2.png");
    this.load.image("ikoHaus3", "ikoHaus3.png");

    // Game Over
    this.load.spritesheet("buttonRestart", "buttonRestart.png", {
      frameWidth: 984,
      frameHeight: 506,
    });

    // Enter Raffle
    this.load.spritesheet("buttonEnterRaffle", "buttonEnterRaffle.png", {
      frameWidth: 984,
      frameHeight: 600,
    });
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.
    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu", { productsAmount: this.productsAmount });
  }
}
