import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  init() {
    screen.orientation.addEventListener("change", () => this.game.scale.refresh());
  }

  preload() {
    //  load in assets for your Preloader
    this.load.setPath("img");

    this.load.image("menuBG", "menuBG.png");
    this.load.image("progressBarOverlay", "progressBarOverlay.png");
  }

  create() {
    this.scene.start("Preloader");
  }
}
