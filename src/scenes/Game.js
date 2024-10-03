import { Scene, Curves } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    this.matter.world.setBounds();
    this.cursors = this.input.keyboard.createCursorKeys();

    // camera
    this.cameras.main.setBackgroundColor(0x00ff00);

    // background
    this.add.image(512, 384, "background").setAlpha(0.5);

    // floor
    const spline = new Curves.Spline([0, this.game.config.height >> 1, this.game.config.width >> 1, this.game.config.height * 0.9, this.game.config.width, this.game.config.height]);
    const points = spline.getPoints(32);
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const rotation = Math.atan2(next.y - current.y, next.x - current.x);
      this.matter.add.rectangle(current.x, current.y, 50, 50, { angle: rotation, friction: 0.001, restitution: 0, isStatic: true });
    }

    //--------
    // Mandal
    const mandalPos = { x: 200, y: 300 };
    const mandalShape = this.cache.json.get("mandalShape");
    const mandalBody = this.matter.composite.create();
    const mandalStatic = false;
    const stiffness = 0.25;
    const damping = 0.5;

    // bodies
    const ski = this.matter.add.sprite(mandalPos.x, mandalPos.y - 10, "ski", null, { shape: mandalShape.ski, collisionFilter: { group: -1 }, friction: 0.001, restitution: 0, frictionAir: 0, isStatic: mandalStatic });
    const calfs = this.matter.add.sprite(mandalPos.x, mandalPos.y - 60, "calfs", null, { shape: mandalShape.calfs, collisionFilter: { group: -1 }, frictionAir: 0, isStatic: mandalStatic });
    const thighs = this.matter.add.sprite(mandalPos.x - 15, mandalPos.y - 105, "thighs", null, { shape: mandalShape.thighs, collisionFilter: { group: -1 }, frictionAir: 0, isStatic: mandalStatic });
    const head = this.matter.add.sprite(mandalPos.x + 60, mandalPos.y - 180, "head", null, { shape: mandalShape.head, collisionFilter: { group: -1 }, frictionAir: 0, isStatic: mandalStatic });
    this.torso = this.matter.add.sprite(mandalPos.x - 10, mandalPos.y - 145, "torso", null, { shape: mandalShape.torso, collisionFilter: { group: -1 }, frictionAir: 0, isStatic: mandalStatic });
    const arm = this.matter.add.sprite(mandalPos.x + 5, mandalPos.y - 135, "arm", null, { shape: mandalShape.arm, collisionFilter: { group: -1 }, frictionAir: 0, isStatic: mandalStatic });

    this.matter.composite.add(mandalBody, [ski, calfs, thighs, head, this.torso, arm]);

    // joints
    const footJoint = this.matter.add.constraint(ski, calfs, 0, 0.5, { pointA: { x: -30, y: -10 }, pointB: { x: -30, y: 40 } });
    const kneeJoint = this.matter.add.constraint(calfs, thighs, 0, 0.5, { pointA: { x: 30, y: -35 }, pointB: { x: 45, y: 10 } });
    const hipJoint = this.matter.add.constraint(thighs, this.torso, 0, 0.5, { pointA: { x: -15, y: -10 }, pointB: { x: -20, y: 25 } });
    const neckJoint = this.matter.add.constraint(this.torso, head, 0, 0.5, { pointA: { x: 55, y: -10 }, pointB: { x: -15, y: 25 } });
    const shoulderJoint = this.matter.add.constraint(this.torso, arm, 0, 0.5, { pointA: { x: 35, y: -5 }, pointB: { x: 15, y: -15 } });

    this.matter.composite.add(mandalBody, [footJoint, kneeJoint, hipJoint, neckJoint, shoulderJoint]);

    // springs
    const spring1 = this.matter.add.constraint(ski, calfs, 140, stiffness, { damping: damping, pointA: { x: 125, y: 10 }, pointB: { x: 30, y: -35 } });
    const spring2 = this.matter.add.constraint(ski, thighs, 135, stiffness, { damping: damping, pointA: { x: -100, y: 10 }, pointB: { x: -15, y: -10 } });
    const spring3 = this.matter.add.constraint(thighs, this.torso, 60, stiffness, { damping: damping, pointA: { x: 45, y: 10 }, pointB: { x: 55, y: -10 } });
    const spring4 = this.matter.add.constraint(this.torso, arm, 35, stiffness, { damping: damping, pointA: { x: 55, y: -10 }, pointB: { x: 50, y: 10 } });
    const spring5 = this.matter.add.constraint(head, this.torso, 60, stiffness, { damping: damping, pointA: { x: -15, y: -10 }, pointB: { x: 0, y: -25 } });

    this.matter.composite.add(mandalBody, [spring1, spring2, spring3, spring4, spring5]);
  }

  update() {
    const { left, right } = this.cursors;

    if (left.isDown) {
      this.torso.setAngularVelocity(-0.1);
    }
    if (right.isDown) {
      this.torso.setAngularVelocity(0.1);
    }
  }
}
