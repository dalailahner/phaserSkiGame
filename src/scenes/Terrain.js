// import Phaser from "phaser";
import { Scene, Math as PhaserMath, Curves, Geom } from "phaser";
import simplify from "simplify-js";

export class Terrain extends Scene {
  constructor() {
    super("Terrain");
    this.chunkSize = 800; // Width of each terrain chunk
    this.noiseScale = 0.001; // Adjust for desired terrain roughness
    this.downhillFactor = 0.35; // Adjust for steepness of descent
  }

  create() {
    // Create curve
    this.graphics = this.add.graphics();
    let startPoint = new PhaserMath.Vector2(0, 50);
    let controlPoint1 = new PhaserMath.Vector2(5, 55);
    let controlPoint2 = new PhaserMath.Vector2(this.sys.game.width - 5, this.sys.game.height - 55);
    let endPoint = new PhaserMath.Vector2(this.sys.game.width, this.sys.game.height - 50);
    this.curve = new Curves.CubicBezier(startPoint, controlPoint1, controlPoint2, endPoint);

    // Draw curve
    this.graphics.lineStyle(2, 0xff0000);
    this.graphics.strokeLineShape(this.curve);

    // Generate points along the curve
    let points = this.curve.getPoints(16);

    // Create Matter body from points
    let body = this.matter.add.fromVertices(this.sys.game.width / 2, this.sys.game.height / 2, points, {
      isStatic: true,
    });

    // Associate Graphics with Matter body
    this.compoundBody = this.matter.add.gameObject(this.graphics, body).setPosition(0, 0, 0);

    // Add a ball to interact with the curve
    this.ball = this.matter.add.circle(400, 100, 20, {
      restitution: 0.8,
    });

    this.player = this.matter.add
      .image(512, 300, "")
      .setBody({
        type: "circle",
        x: 200,
        y: 300,
        width: 100,
        height: 100,
      })
      .setFriction(0, 0, 0);
  }

  update() {
    // this.player.x
  }
}
