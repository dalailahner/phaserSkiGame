import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
    this.productsAmount = 18;
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, "background");

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    // set base path
    this.load.setPath("assets");

    //  Load the assets for the game - Replace with your own assets
    this.load.image("logo", "logo.png");

    // Background
    this.load.image("sky", "sky.jpg");
    this.load.image("mountainsBack", "mountainsBack.png");
    this.load.image("mountainsFront", "mountainsFront.png");
    this.load.image("trees", "trees.png");

    // Floor
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

    // Products
    for (let i = 1; i <= this.productsAmount; i++) {
      this.load.image(`product${i}`, `product${i}.png`);
    }
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu", { productsAmount: this.productsAmount });
  }
}
