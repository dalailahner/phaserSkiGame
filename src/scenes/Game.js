import { Scene, Curves, Math as PhaserMath } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
    this.fixedTimeStep = 1000 / 60;
    this.fixedUpdateTimer = 0;
    this.bgInputScale = 2;
    this.prevScrollX = 0;
    this.nextArticleSpawn = 4000;
    this.bottomOfSlope = 50000;
    this.score = 0;
    this.timerTime = 60;
  }

  init(data) {
    this.productsAmount = data.productsAmount;
  }

  create() {
    //----------
    // Graphics
    this.graphics = this.add.graphics();
    this.graphics.setDepth(10);

    //--------
    // Camera
    this.cameras.main.setBackgroundColor(this.game.config.backgroundColor);
    this.cameras.main.zoom = 1;

    //------------
    // Background
    //   sky
    this.sky = this.add.tileSprite(this.game.config.width / 2, this.game.config.height / 2, this.game.config.width * this.bgInputScale, this.game.config.height * this.bgInputScale, "sky");
    //   mountainsBack
    this.mountainsBack = this.add.tileSprite(this.game.config.width / 2, this.game.config.height / 2, this.game.config.width * this.bgInputScale, this.game.config.height * this.bgInputScale, "mountainsBack");
    this.mountainsBack.setAlpha(0.5);
    //   mountainsFront
    this.mountainsFront = this.add.tileSprite(this.game.config.width / 2, this.game.config.height / 2, this.game.config.width * this.bgInputScale, this.game.config.height * this.bgInputScale, "mountainsFront");
    //   trees
    this.trees = this.add.tileSprite(this.game.config.width / 2, this.game.config.height / 2, this.game.config.width * this.bgInputScale * 2, this.game.config.height * this.bgInputScale * 2, "trees");
    this.trees.setAngle(25);
    //   position
    this.bgElements = [this.sky, this.mountainsBack, this.mountainsFront, this.trees];
    this.bgElementsYshift = {
      elements: [this.mountainsBack, this.mountainsFront],
      offsets: [50, 300],
    };
    this.bgElements.forEach((element) => {
      element.setOrigin(0.5);
      element.setScale(1 / this.bgInputScale);
      element.tilePositionY = 1; // <- fix top border bleeding
      element.setScrollFactor(0);
    });

    //-------
    // Floor
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
    this.drawFloorFromPoints(allPoints, this.spline.points[this.spline.points.length - 1].x);

    //--------
    // Mandal
    const mandalPos = { x: 200, y: 250 };
    const mandalShape = this.cache.json.get("mandalShape");
    this.mandalBody = this.matter.composite.create();
    // TODO: delete mandalStatic when finished:
    const mandalStatic = false;
    const stiffness = 0.35;
    this.maxVelocity = 25;
    this.ragdoll = false;

    //   sprites
    this.ski = this.matter.add.sprite(mandalPos.x, mandalPos.y - 10, "ski", null, { label: "mandal", shape: mandalShape.ski, isStatic: mandalStatic });
    this.calfs = this.matter.add.sprite(mandalPos.x, mandalPos.y - 60, "calfs", null, { label: "mandal", shape: mandalShape.calfs, isStatic: mandalStatic });
    this.thighs = this.matter.add.sprite(mandalPos.x - 15, mandalPos.y - 105, "thighs", null, { label: "mandal,lethal", shape: mandalShape.thighs, isStatic: mandalStatic });
    this.head = this.matter.add.sprite(mandalPos.x + 60, mandalPos.y - 180, "head", null, { label: "mandal,lethal", shape: mandalShape.head, isStatic: mandalStatic });
    this.torso = this.matter.add.sprite(mandalPos.x - 10, mandalPos.y - 145, "torso", null, { label: "mandal,lethal", shape: mandalShape.torso, isStatic: mandalStatic });
    this.cameras.main.startFollow(this.torso);
    this.updateBgYshift(this.bgElementsYshift);
    this.arm = this.matter.add.sprite(mandalPos.x + 5, mandalPos.y - 135, "arm", null, { label: "mandal", shape: mandalShape.arm, isStatic: mandalStatic });

    const mandalSprites = [this.ski, this.calfs, this.thighs, this.head, this.torso, this.arm];
    mandalSprites.forEach((sprite) => sprite.setDepth(10));
    this.matter.composite.add(this.mandalBody, mandalSprites);

    //   joints
    const footJoint = this.matter.add.constraint(this.ski, this.calfs, 0, 0.7, { pointA: { x: -30, y: -10 }, pointB: { x: -30, y: 40 } });
    const kneeJoint = this.matter.add.constraint(this.calfs, this.thighs, 0, 0.7, { pointA: { x: 30, y: -35 }, pointB: { x: 45, y: 10 } });
    const hipJoint = this.matter.add.constraint(this.thighs, this.torso, 0, 0.7, { pointA: { x: -15, y: -10 }, pointB: { x: -20, y: 25 } });
    const neckJoint = this.matter.add.constraint(this.torso, this.head, 0, 0.7, { pointA: { x: 55, y: -10 }, pointB: { x: -15, y: 25 } });
    const shoulderJoint = this.matter.add.constraint(this.torso, this.arm, 0, 0.7, { pointA: { x: 35, y: -5 }, pointB: { x: 15, y: -15 } });

    this.matter.composite.add(this.mandalBody, [footJoint, kneeJoint, hipJoint, neckJoint, shoulderJoint]);

    //   springs
    this.kneeSpring = this.matter.add.constraint(this.ski, this.calfs, 140, stiffness, { pointA: { x: 125, y: 10 }, pointB: { x: 30, y: -35 } });
    this.buttSpring = this.matter.add.constraint(this.ski, this.thighs, 105, stiffness, { pointA: { x: -40, y: 0 }, pointB: { x: -50, y: 0 } });
    this.absSpring = this.matter.add.constraint(this.thighs, this.torso, 60, stiffness, { pointA: { x: 45, y: 10 }, pointB: { x: 55, y: -10 } });
    this.armSpring = this.matter.add.constraint(this.torso, this.arm, 80, 1, { damping: 1, pointA: { x: -55, y: 25 }, pointB: { x: 5, y: -13.5 } });
    this.headSpring = this.matter.add.constraint(this.torso, this.head, 40, 1, { damping: 1, pointA: { x: 80, y: -60 }, pointB: { x: -8, y: 12 } });

    this.matter.composite.add(this.mandalBody, [this.kneeSpring, this.buttSpring, this.absSpring, this.armSpring, this.headSpring]);

    //----
    // UI
    this.uiCont = this.add.container(this.game.config.width / 2, this.game.config.height / 2);
    this.uiCont.setScrollFactor(0);
    //   score text
    this.scoreText = this.add.text(300, -350, `Score: ${this.score}`, {
      fontFamily: "'Open Sans', sans-serif",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#191919",
    });
    //   timer text
    this.timerText = this.add.text(50, -350, `Time left: ${this.timerTime}`, {
      fontFamily: "'Open Sans', sans-serif",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#191919",
    });
    //   add texts to UI container
    this.uiCont.add(this.scoreText);
    this.uiCont.add(this.timerText);

    //----------
    // Controls
    this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT");

    //-------
    // Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.timerTick,
      callbackScope: this,
      loop: true,
    });

    //------------
    // Collisions
    this.matter.world.on("collisionstart", (event, bodyA, bodyB) => {
      // product
      if (bodyA.parent.label.split(",").includes("mandal") && bodyB.label.split(",").includes("product")) {
        this.collectProduct(bodyB);
      }
      if (bodyB.parent.label.split(",").includes("mandal") && bodyA.label.split(",").includes("product")) {
        this.collectProduct(bodyA);
      }

      // game over
      if (bodyA.parent.label.split(",").includes("lethal") && bodyB.label.split(",").includes("floor")) {
        this.time.addEvent({
          callback: this.gameOver(bodyA),
          callbackScope: this,
        });
      }
      if (bodyB.parent.label.split(",").includes("lethal") && bodyA.label.split(",").includes("floor")) {
        this.time.addEvent({
          callback: this.gameOver(bodyB),
          callbackScope: this,
        });
      }
    });

    // Fixed Update Timer
    this.fixedUpdateTimer = this.time.addEvent({
      delay: this.fixedTimeStep,
      callback: this.fixedUpdate,
      callbackScope: this,
      loop: true,
    });

    // pause and resume on lost focus
    //   lost focus
    this.game.events.on("hidden", () => {
      this.matter.world.pause();
      this.fixedUpdateTimer.paused = true;
      this.timerEvent.paused = true;
      this.scene.pause();
    });
    //   regain focus
    this.game.events.on("visible", () => {
      this.matter.world.resume();
      this.fixedUpdateTimer.paused = false;
      this.timerEvent.paused = false;
      this.scene.resume();
    });
  }

  fixedUpdate() {
    //----------
    // Controls
    if (!this.ragdoll) {
      // LEFT
      if (this.keys.LEFT.isDown || this.keys.A.isDown) {
        if (this.keys.DOWN.isDown || this.keys.S.isDown) {
          this.torso.setAngularVelocity(this.torso.getAngularVelocity() - 0.025);
        } else {
          this.torso.setAngularVelocity(this.torso.getAngularVelocity() - 0.1);
        }
      }
      // RIGHT
      if (this.keys.RIGHT.isDown || this.keys.D.isDown) {
        if (this.keys.DOWN.isDown || this.keys.S.isDown) {
          this.torso.setAngularVelocity(this.torso.getAngularVelocity() + 0.025);
        } else {
          this.torso.setAngularVelocity(this.torso.getAngularVelocity() + 0.1);
        }
      }
      // DOWN
      if (this.keys.DOWN.isDown || this.keys.S.isDown) {
        this.maxVelocity = this.lerp(this.maxVelocity, 35, 0.01);
        this.kneeSpring.length = this.lerp(this.kneeSpring.length, 100, 0.25);
        this.buttSpring.length = this.lerp(this.buttSpring.length, 75, 0.25);
        this.absSpring.length = this.lerp(this.absSpring.length, 60, 0.25);
      }
      // UP
      if (this.keys.UP.isDown || this.keys.W.isDown) {
        this.kneeSpring.length = this.lerp(this.kneeSpring.length, 150, 0.25);
        this.buttSpring.length = this.lerp(this.buttSpring.length, 160, 0.25);
        this.absSpring.length = this.lerp(this.absSpring.length, 110, 0.25);
      }
      // IDLE
      if (this.keys.UP.isUp && this.keys.DOWN.isUp && this.keys.W.isUp && this.keys.S.isUp) {
        this.maxVelocity = this.lerp(this.maxVelocity, 25, 0.01);
        this.kneeSpring.length = this.lerp(this.kneeSpring.length, 140, 0.25);
        this.buttSpring.length = this.lerp(this.buttSpring.length, 105, 0.25);
        this.absSpring.length = this.lerp(this.absSpring.length, 60, 0.25);
      }
    }
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

      // create bodies along the spline
      const allPoints = this.spline.getDistancePoints(100);
      const points = allPoints.slice(oldLength - 6, -1);
      this.drawFloorFromPoints(points, this.spline.points[this.spline.points.length - 3].x);

      // remove old objects
      while (this.spline.points.length > 20) {
        this.spline.points.shift();
      }
      while (this.floorArr.length > 100) {
        this.matter.world.remove(this.floorArr[0].body);
        this.floorArr[0].destroy();
        this.floorArr.shift();
      }
    }

    //-------------------
    // Cap Body Velocity
    const torsoVelocity = this.torso.body.velocity;
    const mandalSpeed = Math.sqrt(torsoVelocity.x * torsoVelocity.x + torsoVelocity.y * torsoVelocity.y);

    if (mandalSpeed > this.maxVelocity) {
      const scale = this.maxVelocity / mandalSpeed;
      this.matter.body.setVelocity(this.torso.body, {
        x: torsoVelocity.x * scale,
        y: torsoVelocity.y * scale,
      });
    }

    //----------
    // Products
    if (this.torso.y > this.nextArticleSpawn) {
      const floorPoint1 = new PhaserMath.Vector2(this.floorArr[this.floorArr.length - 2]);
      const floorPoint2 = new PhaserMath.Vector2(this.floorArr[this.floorArr.length - 1]);
      const spawnPoint = floorPoint1.add(floorPoint2).scale(0.5).add(floorPoint2.subtract(floorPoint1).normalizeLeftHand().scale(5));

      const product = this.matter.add.sprite(spawnPoint.x, spawnPoint.y, `product${PhaserMath.Between(1, this.productsAmount)}`, null, { label: "product", isSensor: true, isStatic: true, shape: { type: "circle", radius: 125 } });
      product.setAngle(-5);

      // anim
      this.tweens.add({
        targets: product,
        angle: 5,
        duration: 333,
        yoyo: true,
        loop: -1,
        ease: "sine.inout",
      });

      // fx
      product.postFX.setPadding(16);
      const glow = product.postFX.addGlow(0xa0ff0f, 16);
      this.tweens.add({
        targets: glow,
        outerStrength: 4,
        duration: 500,
        yoyo: true,
        loop: -1,
        ease: "sine.inout",
      });
      product.postFX.addShine(3, 0.333, 5);

      this.nextArticleSpawn += 4000;
    }

    //--------
    // Camera
    //   zoom
    const mappedZoomValue = this.mapValue(mandalSpeed, 0, this.maxVelocity, 1, 0.33);
    this.cameras.main.zoom = this.lerp(this.cameras.main.zoom, mappedZoomValue, 0.01);
    //   offset
    const mappedOffsetValue = this.mapValue(mandalSpeed, 0, this.maxVelocity, 0, 1);
    this.cameras.main.setFollowOffset(this.lerp(this.cameras.main.followOffset.x, -750 * mappedOffsetValue, 0.01), this.lerp(this.cameras.main.followOffset.y, -333 * mappedOffsetValue, 0.01));

    //------------
    // Background
    //   counter zoom
    this.bgElements.forEach((element) => element.setScale(1 / this.bgInputScale / this.cameras.main.zoom));
    //   parallax x shift
    const scrollDistance = this.cameras.main.scrollX - this.prevScrollX;
    this.mountainsBack.tilePositionX += scrollDistance * 0.01;
    this.mountainsFront.tilePositionX += scrollDistance * 0.025;
    this.trees.tilePositionX += scrollDistance * 0.05;
    this.prevScrollX = this.cameras.main.scrollX;
    //   parallax y shift
    this.updateBgYshift(this.bgElementsYshift);

    //----
    // UI
    this.uiCont.setScale(1 / this.cameras.main.zoom);
  }

  //------------------
  // Custom Functions
  updateBgYshift(obj) {
    const Yshift = this.mapValue(this.torso.y, 0, this.bottomOfSlope, 1, 0);
    for (let i = 0; i < obj.elements.length; i++) {
      obj.elements[i].y = this.game.config.height * obj.elements[i].originY + obj.offsets[i] * Yshift * obj.elements[i].scale;
    }
  }

  drawFloorFromPoints(points, maxPoint) {
    if (points.length > 2) {
      for (let i = 0; i < points.length - 1; i++) {
        if (this.floorMin <= points[i].x <= maxPoint) {
          const current = points[i];
          const next = points[i + 1];
          const rotation = Math.atan2(next.y - current.y, next.x - current.x);

          // add image texture
          const floorObj = this.matter.add.image(current.x, current.y, `floorSnow${PhaserMath.Between(1, 3)}`, null, { angle: rotation });
          floorObj.setDepth(11);
          floorObj.setDisplaySize(150, 150);

          // add physics body
          floorObj.setRectangle(150, 130, { label: "floor", angle: rotation, chamfer: { radius: 50 }, collisionFilter: { group: -10 }, friction: 0.001, restitution: 0, isStatic: true });
          this.floorArr.push(floorObj);
        }
      }
      // fill the area beneath the points
      const fillPoints = [...points]; // <- deep copy with spread operator
      fillPoints.push({ x: points[points.length - 1].x, y: points[points.length - 1].y + this.game.config.height * 2 });
      fillPoints.push({ x: points[0].x - this.game.config.width, y: points[points.length - 1].y + this.game.config.height });

      // draw the area beneath the points of the spline
      this.graphics.fillStyle(0xf5f5f5);
      this.graphics.fillPoints(fillPoints, true, true);
      this.graphics.lineStyle(130, 0xf5f5f5);
      this.graphics.strokePoints(fillPoints, true, true);

      // set new min point for next iteration
      this.floorMin = maxPoint;
    }
  }

  collectProduct(body) {
    if (body.gameObject) {
      this.tweens.killTweensOf(body.gameObject);
      this.matter.world.remove(body);
      body.gameObject.destroy();
    }
    if (!this.ragdoll) {
      this.score += 1;
      this.scoreText.setText(`Score: ${this.score}`);
    }
  }

  timerTick() {
    this.timerTime -= 1;
    this.timerText.setText("Time left: " + this.timerTime);

    if (this.timerTime <= 0) {
      this.timerEvent.remove();
      // TODO: Timer ended -> start end sequence
    }
  }

  gameOver(bodyPart) {
    console.log(`game over, you hit your: ${bodyPart.parent.label}`);
    this.ragdoll = true;
    [this.kneeSpring, this.buttSpring, this.absSpring, this.armSpring, this.headSpring].forEach((spring) => {
      spring.stiffness = 0.005;
    });
    setTimeout(() => {
      this.tweens.killAll();
      this.scene.start("GameOver");
    }, 2500);
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
