import { Scene, Curves, Math as PhaserMath } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  init(data) {
    this.productsAmount = data.productsAmount;
    this.isTouchDevice = data.isTouchDevice;

    screen.orientation.addEventListener("change", () => this.game.scale.refresh());

    this.fixedTimeStep = 1000 / 60;
    this.fixedUpdateTimer = undefined;
    this.bgInputScale = 2;
    this.prevScrollX = 0;
    this.nextArticleSpawn = 4000;
    this.bottomOfSlope = 50000;
    this.score = 0;
    this.timerTime = 60;
    this.runFinished = false;
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
    this.sky.setDepth(1);
    //   mountainsBack
    this.mountainsBack = this.add.tileSprite(this.game.config.width / 2, this.game.config.height / 2, this.game.config.width * this.bgInputScale, this.game.config.height * this.bgInputScale, "mountainsBack");
    this.mountainsBack.setAlpha(0.5).setDepth(2);
    //   mountainsFront
    this.mountainsFront = this.add.tileSprite(this.game.config.width / 2, this.game.config.height / 2, this.game.config.width * this.bgInputScale, this.game.config.height * this.bgInputScale, "mountainsFront");
    this.mountainsFront.setDepth(3);
    //   plane
    this.planeCont = this.add.container(this.game.config.width / 2, this.game.config.height / 2);
    this.planeCont.setDepth(4).setScrollFactor(0);
    //   trees
    this.trees = this.add.tileSprite(this.game.config.width / 2, this.game.config.height / 2, this.game.config.width * this.bgInputScale * 2, this.game.config.height * this.bgInputScale * 2, "trees");
    this.trees.setAngle(25).setDepth(5);
    //   position
    this.bgElements = [this.sky, this.mountainsBack, this.mountainsFront, this.trees];
    this.bgElementsYshift = {
      elements: [this.mountainsBack, this.mountainsFront],
      offsets: [50, 300],
    };
    this.bgElements.forEach((element) => {
      element.setOrigin(0.5);
      element.setScale(1 / this.bgInputScale);
      element.setScrollFactor(0);
      if (typeof element.tilePositionY === "number") {
        element.tilePositionY = 1; // <- fix top border bleeding
      }
    });

    //-------
    // Floor
    this.floorArr = [];
    this.floorMin = 0;
    //   create curve
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
    //   taferl
    const taferlPos = { x: this.spline.getPoint(0.9).x, y: this.spline.getPoint(0.9).y - 70 };
    this.add.image(taferlPos.x, taferlPos.y, "taferl").setOrigin(0.5, 1).setScale(0.5);
    //   draw floor
    const allPoints = this.spline.getDistancePoints(100);
    this.drawFloorFromPoints(allPoints, this.spline.points[this.spline.points.length - 1].x);

    //--------
    // Mandal
    const mandalPos = { x: 200, y: 250 };
    const mandalShape = this.cache.json.get("mandalShape");
    this.mandalBody = this.matter.composite.create();
    const stiffness = 0.35;
    this.mandalSpeed = 0;
    this.maxVelocity = 25;
    this.ragdoll = false;

    //   sprites
    this.ski = this.matter.add.sprite(mandalPos.x, mandalPos.y - 10, "ski", null, { label: "mandal", shape: mandalShape.ski });
    this.calfs = this.matter.add.sprite(mandalPos.x, mandalPos.y - 60, "calfs", null, { label: "mandal", shape: mandalShape.calfs });
    this.thighs = this.matter.add.sprite(mandalPos.x - 15, mandalPos.y - 105, "thighs", null, { label: "mandal,lethal", shape: mandalShape.thighs });
    this.head = this.matter.add.sprite(mandalPos.x + 60, mandalPos.y - 180, "head", null, { label: "mandal,lethal", shape: mandalShape.head });
    this.torso = this.matter.add.sprite(mandalPos.x - 10, mandalPos.y - 145, "torso", null, { label: "mandal,lethal", shape: mandalShape.torso });
    this.cameras.main.startFollow(this.torso);
    this.updateBgYshift(this.bgElementsYshift);
    this.arm = this.matter.add.sprite(mandalPos.x + 5, mandalPos.y - 135, "arm", null, { label: "mandal", shape: mandalShape.arm });

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
    //   container
    this.uiCont = this.add.container(this.game.config.width / 2, this.game.config.height / 2);
    this.uiCont.setDepth(90).setScrollFactor(0);
    //   score sign
    this.scoreSign = this.add.image(285, -325, "scoreSign").setOrigin(0, 0.5).setScale(0.5).setScrollFactor(0);
    this.uiCont.add(this.scoreSign);
    //   score text
    this.scoreText = this.add
      .text(383, -308, this.score, {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: 48,
        fontStyle: "bold",
        color: "#422d19",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.uiCont.add(this.scoreText);

    //   plane
    this.anims.create({
      key: "idle",
      frames: "plane",
      frameRate: 12,
      repeat: -1,
    });
    this.plane = this.add.sprite(this.game.config.width >> 1, this.game.config.height * 0.3 * -1, "plane");
    this.plane.setOrigin(0, 0.5).setScale(0.5).setDepth(4).setScrollFactor(0);
    this.plane.play("idle");
    this.planeCont.add(this.plane);

    //----------
    // Controls
    //   keyboard
    this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT");
    //   touch
    const touchControlsPadding = { x: this.game.config.width * 0.025, y: this.game.config.height * 0.025 };
    const touchControlsPos = [
      {
        x: touchControlsPadding.x - this.game.config.width / 2,
        y: this.game.config.height - 125 - touchControlsPadding.y * 2 - this.game.config.height / 2,
      },
      {
        x: touchControlsPadding.x - this.game.config.width / 2,
        y: this.game.config.height - touchControlsPadding.y - this.game.config.height / 2,
      },
      {
        x: this.game.config.width - 125 - touchControlsPadding.x * 2 - this.game.config.width / 2,
        y: this.game.config.height - touchControlsPadding.y - this.game.config.height / 2,
      },
      {
        x: this.game.config.width - touchControlsPadding.x - this.game.config.width / 2,
        y: this.game.config.height - touchControlsPadding.y - this.game.config.height / 2,
      },
    ];
    this.touchControls = [];
    this.touchControls.push(this.add.sprite(touchControlsPos[0].x, touchControlsPos[0].y, "touchControlsLeft", 0).setOrigin(0, 1));
    this.touchControls.push(this.add.sprite(touchControlsPos[1].x, touchControlsPos[1].y, "touchControlsLeft", 2).setOrigin(0, 1));
    this.touchControls.push(this.add.sprite(touchControlsPos[2].x, touchControlsPos[2].y, "touchControlsRight", 0).setOrigin(1, 1));
    this.touchControls.push(this.add.sprite(touchControlsPos[3].x, touchControlsPos[3].y, "touchControlsRight", 2).setOrigin(1, 1));
    this.touchControls.forEach((btn) => {
      btn.setScale(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);
      this.uiCont.add(btn);
      btn.on("pointerover", () => {
        btn.setFrame(btn.frame.name + 1);
        btn.isDown = true;
      });
      btn.on("pointerout", () => {
        btn.setFrame(btn.frame.name - 1);
        btn.isDown = false;
      });
    });
    //   disable touch button if keyboard is available
    if (!this.isTouchDevice) {
      this.touchControls.forEach((btn) => {
        if (btn.active) {
          btn.destroy();
        }
      });
    }

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
      if ((bodyA.parent.label.split(",").includes("lethal") && bodyB.label.split(",").includes("floor")) || (bodyB.parent.label.split(",").includes("lethal") && bodyA.label.split(",").includes("floor"))) {
        if (!this.ragdoll) {
          this.time.addEvent({
            loop: false,
            repeat: 0,
            callback: this.gameOver(),
            callbackScope: this,
          });
        }
      }
    });

    // Fixed Update Timer
    this.fixedUpdateTimer = this.time.addEvent({
      delay: this.fixedTimeStep,
      loop: true,
      callback: this.fixedUpdate,
      callbackScope: this,
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
    //-------
    // Plane
    this.plane.x -= 0.5;

    //----------
    // Controls
    const UP = this.keys.UP.isDown || this.keys.W.isDown || this.touchControls[0].isDown;
    const DOWN = this.keys.DOWN.isDown || this.keys.S.isDown || this.touchControls[1].isDown;
    const LEFT = this.keys.LEFT.isDown || this.keys.A.isDown || this.touchControls[2].isDown;
    const RIGHT = this.keys.RIGHT.isDown || this.keys.D.isDown || this.touchControls[3].isDown;
    if (!this.ragdoll) {
      // LEFT
      if (LEFT) {
        if (DOWN) {
          this.torso.setAngularVelocity(this.torso.getAngularVelocity() - 0.025);
        } else {
          this.torso.setAngularVelocity(this.torso.getAngularVelocity() - 0.1);
        }
      }
      // RIGHT
      if (RIGHT) {
        if (DOWN) {
          this.torso.setAngularVelocity(this.torso.getAngularVelocity() + 0.025);
        } else {
          this.torso.setAngularVelocity(this.torso.getAngularVelocity() + 0.1);
        }
      }
      // DOWN
      if (DOWN) {
        if (!this.runFinished) {
          this.maxVelocity = this.lerp(this.maxVelocity, 35, 0.01);
        }
        this.kneeSpring.length = this.lerp(this.kneeSpring.length, 100, 0.25);
        this.buttSpring.length = this.lerp(this.buttSpring.length, 75, 0.25);
        this.absSpring.length = this.lerp(this.absSpring.length, 60, 0.25);
      }
      // UP
      if (UP) {
        this.kneeSpring.length = this.lerp(this.kneeSpring.length, 150, 0.25);
        this.buttSpring.length = this.lerp(this.buttSpring.length, 160, 0.25);
        this.absSpring.length = this.lerp(this.absSpring.length, 110, 0.25);
      }
      // IDLE
      if (!UP && !DOWN) {
        if (!this.runFinished) {
          this.maxVelocity = this.lerp(this.maxVelocity, 25, 0.01);
        }
        this.kneeSpring.length = this.lerp(this.kneeSpring.length, 140, 0.25);
        this.buttSpring.length = this.lerp(this.buttSpring.length, 105, 0.25);
        this.absSpring.length = this.lerp(this.absSpring.length, 60, 0.25);
      }
    }

    //--------
    // Camera
    if (!this.runFinished) {
      //   zoom
      const mappedZoomValue = this.mapValue(this.mandalSpeed, 0, this.maxVelocity, 1, 0.33);
      this.cameras.main.zoom = this.lerp(this.cameras.main.zoom, mappedZoomValue, 0.01);
      //   offset
      const mappedOffsetValue = this.mapValue(this.mandalSpeed, 0, this.maxVelocity, 0, 1);
      this.cameras.main.setFollowOffset(this.lerp(this.cameras.main.followOffset.x, -750 * mappedOffsetValue, 0.01), this.lerp(this.cameras.main.followOffset.y, -333 * mappedOffsetValue, 0.01));
    } else {
      //   zoom
      this.cameras.main.zoom = this.lerp(this.cameras.main.zoom, 0.33, 0.005);
      //   offset
      this.cameras.main.setFollowOffset(this.lerp(this.cameras.main.followOffset.x, 0, 0.005), this.lerp(this.cameras.main.followOffset.y, 400, 0.01));
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
      if (!this.runFinished) {
        while (this.spline.points.length > 20) {
          this.spline.points.shift();
        }
        while (this.floorArr.length > 100) {
          this.matter.world.remove(this.floorArr[0].body);
          this.floorArr[0].destroy();
          this.floorArr.shift();
        }
      }
    }

    //-------------------
    // Cap Body Velocity
    this.mandalSpeed = Math.sqrt(this.torso.body.velocity.x * this.torso.body.velocity.x + this.torso.body.velocity.y * this.torso.body.velocity.y);

    if (this.mandalSpeed > this.maxVelocity) {
      const scale = this.maxVelocity / this.mandalSpeed;
      this.matter.body.setVelocity(this.torso.body, {
        x: this.torso.body.velocity.x * scale,
        y: this.torso.body.velocity.y * scale,
      });
    }

    //-----------------------
    // Slow down on Finished
    if (this.runFinished) {
      if (this.torso.x > this.stopPoint) {
        this.maxVelocity = this.lerp(this.maxVelocity, 0, 0.02);
      }
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
        ease: "Sine.inout",
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
        ease: "Sine.inout",
      });
      product.postFX.addShine(3, 0.333, 5);

      this.nextArticleSpawn += 4000;
    }

    //------------
    // Background
    //   counter zoom
    this.bgElements.forEach((element) => element.setScale(1 / this.bgInputScale / this.cameras.main.zoom));
    //   parallax x shift
    const scrollDistance = this.cameras.main.scrollX - this.prevScrollX;
    this.mountainsBack.tilePositionX += scrollDistance * 0.01;
    this.mountainsFront.tilePositionX += scrollDistance * 0.025;
    this.planeCont.setScale(1 / this.cameras.main.zoom);
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

  collectProduct(productBody) {
    if (productBody.gameObject && !this.ragdoll) {
      const textureName = productBody.gameObject?.texture.key;
      const match = textureName?.match(/\d+/);
      const productNumber = match ? Number(match[0]) : null;

      // increase the points according to product
      switch (productNumber) {
        case 1:
          this.score += 25;
          break;

        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
          this.score += 50;
          break;

        case 16:
        case 17:
        case 18:
          this.score += 150;
          break;

        case 14:
        case 15:
          this.score += 200;
          break;

        default:
          this.score += 100;
          break;
      }

      // update score text
      this.scoreText.setText(this.score);

      // remove the product entirely
      this.tweens.killTweensOf(productBody.gameObject);
      this.matter.world.remove(productBody);
      productBody.gameObject.destroy();
    }
  }

  timerTick() {
    this.timerTime -= 1;

    if (this.timerTime <= 0) {
      this.timerEvent.remove();

      // set run to finished
      this.runFinished = true;

      // remove touch btns if active
      setTimeout(() => {
        this.touchControls.forEach((btn) => {
          if (btn.active) {
            btn.destroy();
          }
        });
      }, 1000);

      // draw building
      this.ikoHaus1 = this.add.image(this.spline.points[this.spline.points.length - 1].x, this.spline.points[this.spline.points.length - 1].y + 50, "ikoHaus1").setOrigin(0, 1);
      this.ikoHaus2 = this.add.image(this.ikoHaus1.getBottomRight().x, this.ikoHaus1.getBottomRight().y, "ikoHaus2").setOrigin(0, 1);
      this.ikoHaus3 = this.add.image(this.ikoHaus2.getBottomRight().x, this.ikoHaus2.getBottomRight().y, "ikoHaus3").setOrigin(0, 1);

      // set stop point (is used in update function)
      this.stopPoint = this.ikoHaus2.getBottomCenter().x;

      // draw floor
      const oldLength = this.spline.getDistancePoints(100).length;
      this.spline.points.push({ x: this.spline.points[this.spline.points.length - 1].x + this.ikoHaus1.displayWidth * 3, y: this.spline.points[this.spline.points.length - 1].y });
      this.spline.updateArcLengths();
      const allPoints = this.spline.getDistancePoints(100);
      const points = allPoints.slice(oldLength - 6, -1);
      this.drawFloorFromPoints(points, this.spline.points[this.spline.points.length - 1].x);

      // headline
      const finishHeadline = this.add
        .text(0, ((this.game.config.height >> 1) + 50) * -1, "Geschafft!", {
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 72,
          fontStyle: "bold",
          color: "#ffffff",
          stroke: "#006d9f",
          strokeThickness: 8,
          align: "center",
        })
        .setOrigin(0.5)
        .setScrollFactor(0);

      this.uiCont.add(finishHeadline);

      // show btn to enter the raffle
      const buttonEnterRaffle = this.add
        .sprite(0, this.game.config.height >> 1, "buttonEnterRaffle", 0)
        .setScale(0.5)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0);
      buttonEnterRaffle.setPosition(0, (this.game.config.height >> 1) + buttonEnterRaffle.displayHeight);

      this.uiCont.add(buttonEnterRaffle);

      //   FX
      const buttonEnterRaffleGlow = buttonEnterRaffle.preFX.addGlow(0xf2c668, 4, 2);
      buttonEnterRaffle.preFX.setPadding(32);

      //   anims & events
      this.tweens.add({
        targets: finishHeadline,
        y: ((this.game.config.height >> 1) - 75) * -1,
        delay: 3000,
        duration: 1000,
        ease: "Sine.inOut",
      });

      this.tweens.add({
        targets: buttonEnterRaffle,
        y: (this.game.config.height >> 1) - (buttonEnterRaffle.displayHeight >> 1) - this.game.config.height * 0.05,
        delay: 3000,
        duration: 1000,
        ease: "Sine.inOut",
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
          scale: 0.52,
          duration: 150,
          ease: "Expo.out",
        });
      });
      buttonEnterRaffle.on("pointerout", () => {
        buttonEnterRaffle.setFrame(0);
        this.tweens.add({
          targets: buttonEnterRaffle,
          scale: 0.5,
          duration: 150,
          ease: "Expo.out",
        });
      });
      buttonEnterRaffle.on("pointerdown", () => {
        window.top.open("https://forms.sn.at/iko-gewinnspiel/?score=test");
      });
    }
  }

  gameOver() {
    if (!this.runFinished) {
      this.ragdoll = true;
      [this.kneeSpring, this.buttSpring, this.absSpring, this.armSpring, this.headSpring].forEach((spring) => {
        spring.stiffness = 0.005;
      });
      setTimeout(() => {
        this.tweens.killAll();
        this.game.events.removeAllListeners();
        this.scene.start("GameOver", { productsAmount: this.productsAmount, score: this.score });
      }, 2500);
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
