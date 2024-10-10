import { Scene, Curves, Math as PhaserMath } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    // background
    this.add.image(512, 384, "background").setAlpha(0.5);

    // floor
    this.floorArr = [];
    this.floorMin = 0;
    this.spline = new Curves.Spline([
      this.game.config.width * -1,
      this.game.config.height >> 1,
      0,
      this.game.config.height >> 1,
      this.game.config.width >> 1,
      this.game.config.height * 0.8,
      this.game.config.width,
      this.game.config.height,
      this.game.config.width * 1.5,
      this.game.config.height,
    ]);
    const allPoints = this.spline.getDistancePoints(100);
    this.drawFloorFromPoints(this, allPoints, this.spline.points[this.spline.points.length - 1].x);

    //--------
    // Mandal
    const mandalPos = { x: 200, y: 250 };
    const mandalShape = this.cache.json.get("mandalShape");
    this.mandalBody = this.matter.composite.create();
    // TODO: delete mandalStatic when finished:
    const mandalStatic = false;
    const stiffness = 0.35;
    this.maxVelocity = 25;

    // sprites
    this.ski = this.matter.add.sprite(mandalPos.x, mandalPos.y - 10, "ski", null, { shape: mandalShape.ski, isStatic: mandalStatic });
    this.calfs = this.matter.add.sprite(mandalPos.x, mandalPos.y - 60, "calfs", null, { shape: mandalShape.calfs, isStatic: mandalStatic });
    this.thighs = this.matter.add.sprite(mandalPos.x - 15, mandalPos.y - 105, "thighs", null, { shape: mandalShape.thighs, isStatic: mandalStatic });
    this.head = this.matter.add.sprite(mandalPos.x + 60, mandalPos.y - 180, "head", null, { shape: mandalShape.head, isStatic: mandalStatic });
    this.torso = this.matter.add.sprite(mandalPos.x - 10, mandalPos.y - 145, "torso", null, { shape: mandalShape.torso, isStatic: mandalStatic });
    this.arm = this.matter.add.sprite(mandalPos.x + 5, mandalPos.y - 135, "arm", null, { shape: mandalShape.arm, isStatic: mandalStatic });

    this.matter.composite.add(this.mandalBody, [this.ski, this.calfs, this.thighs, this.head, this.torso, this.arm]);

    // joints
    const footJoint = this.matter.add.constraint(this.ski, this.calfs, 0, 0.7, { pointA: { x: -30, y: -10 }, pointB: { x: -30, y: 40 } });
    const kneeJoint = this.matter.add.constraint(this.calfs, this.thighs, 0, 0.7, { pointA: { x: 30, y: -35 }, pointB: { x: 45, y: 10 } });
    const hipJoint = this.matter.add.constraint(this.thighs, this.torso, 0, 0.7, { pointA: { x: -15, y: -10 }, pointB: { x: -20, y: 25 } });
    const neckJoint = this.matter.add.constraint(this.torso, this.head, 0, 0.7, { pointA: { x: 55, y: -10 }, pointB: { x: -15, y: 25 } });
    const shoulderJoint = this.matter.add.constraint(this.torso, this.arm, 0, 0.7, { pointA: { x: 35, y: -5 }, pointB: { x: 15, y: -15 } });

    this.matter.composite.add(this.mandalBody, [footJoint, kneeJoint, hipJoint, neckJoint, shoulderJoint]);

    // springs
    const kneeSpring = this.matter.add.constraint(this.ski, this.calfs, 140, stiffness, { pointA: { x: 125, y: 10 }, pointB: { x: 30, y: -35 } });
    const buttSpring = this.matter.add.constraint(this.ski, this.thighs, 135, stiffness, { pointA: { x: -100, y: 10 }, pointB: { x: -15, y: -10 } });
    const absSpring = this.matter.add.constraint(this.thighs, this.torso, 60, stiffness, { pointA: { x: 45, y: 10 }, pointB: { x: 55, y: -10 } });
    const armSpring = this.matter.add.constraint(this.torso, this.arm, 80, 1, { damping: 1, pointA: { x: -55, y: 20 }, pointB: { x: 5, y: -11 } });
    const headSpring = this.matter.add.constraint(this.torso, this.head, 40, 1, { damping: 1, pointA: { x: 80, y: -60 }, pointB: { x: -8, y: 12 } });

    this.matter.composite.add(this.mandalBody, [kneeSpring, buttSpring, absSpring, armSpring, headSpring]);

    //----------
    // Graphics
    this.graphics = this.add.graphics();

    //--------
    // Camera
    this.cameras.main.setBackgroundColor(this.game.config.backgroundColor);
    this.cameras.main.startFollow(this.torso);
    this.cameras.main.zoom = 1;

    //----------
    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    //-------
    // Floor
    if (this.spline.points[this.spline.points.length - 3].x < this.game.config.width + this.cameras.main.midPoint.x) {
      const oldLength = this.spline.getDistancePoints(100).length;
      while (this.spline.points[this.spline.points.length - 3].x < this.game.config.width + this.cameras.main.midPoint.x) {
        for (let i = 0; i < 3; i++) {
          this.spline.addPoint(this.spline.getEndPoint().x + PhaserMath.Between(250, 1000), this.spline.getEndPoint().y + PhaserMath.Between(100, 500));
        }
      }
      this.spline.updateArcLengths();

      // TODO: delete debug line when finished
      this.graphics.clear();
      this.graphics.lineStyle(5, 0xff0000);
      this.spline.draw(this.graphics, this.spline.getDistancePoints(100).length);

      const allPoints = this.spline.getDistancePoints(100);
      const points = allPoints.slice(oldLength - 6, -1);
      this.drawFloorFromPoints(this, points, this.spline.points[this.spline.points.length - 3].x);

      while (this.spline.points.length > 20) {
        this.spline.points.shift();
      }
      while (this.floorArr.length > 100) {
        this.floorArr[0].destroy();
        this.floorArr.shift();
      }
    }

    //--------------
    // cap velocity
    //TODO: maybe performance improvment if you only do this on torso
    [this.ski, this.calfs, this.thighs, this.head, this.torso, this.arm].forEach((sprite) => {
      const velocity = sprite.body.velocity;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      if (speed > this.maxVelocity) {
        const scale = this.maxVelocity / speed;
        this.matter.body.setVelocity(sprite.body, {
          x: velocity.x * scale,
          y: velocity.y * scale,
        });
      }
    });

    //--------
    // Camera
    const torsoVelocity = this.torso.body.velocity;
    const mappedZoomValue = this.mapValue(Math.sqrt(torsoVelocity.x * torsoVelocity.x + torsoVelocity.y * torsoVelocity.y), 0, this.maxVelocity, 1, 0.33);
    this.cameras.main.zoom = this.lerp(this.cameras.main.zoom, mappedZoomValue, 0.01);

    //----------
    // Controls
    if (this.cursors.left.isDown) {
      this.torso.setAngularVelocity(this.torso.getAngularVelocity() - 0.1);
    }
    if (this.cursors.right.isDown) {
      this.torso.setAngularVelocity(this.torso.getAngularVelocity() + 0.1);
    }
  }

  // custom functions
  drawFloorFromPoints(scene, points, maxPoint) {
    if (points.length > 2) {
      for (let i = 0; i < points.length - 1; i++) {
        if (scene.floorMin <= points[i].x <= maxPoint) {
          const current = points[i];
          const next = points[i + 1];
          const rotation = Math.atan2(next.y - current.y, next.x - current.x);

          const floorObj = this.matter.add.image(current.x, current.y, `floorSnow${PhaserMath.Between(1, 3)}`, null, { angle: rotation });
          floorObj.setDisplaySize(150, 150);
          floorObj.setRectangle(150, 130, { angle: rotation, chamfer: { radius: 50 }, collisionFilter: { group: -10 }, friction: 0.001, restitution: 0, isStatic: true });
          scene.floorArr.push(floorObj);
        }
      }
      scene.floorMin = maxPoint;
    }
  }

  mapValue(value, fromMin, fromMax, toMin, toMax) {
    const scaledValue = (Math.max(fromMin, Math.min(value, fromMax)) - fromMin) / (fromMax - fromMin);
    const mappedValue = toMin + scaledValue * (toMax - toMin);
    return Math.round(mappedValue * 1000) / 1000;
  }

  lerp(from, to, t) {
    return from * (1 - t) + to * t;
  }
}
