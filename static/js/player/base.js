import { AcGameObject } from '/static/js/ac_game_object/base.js';

// 位置、速度、方向，用状态机来对所有状态进行区分
export class player extends AcGameObject {
    constructor(root, info) {
        super();

        // root用来索引的
        this.root = root;
        this.id = info.id;
        this.x = info.x;
        this.y = info.y;
        this.width = info.width;
        this.height = info.height;
        this.color = info.color;

        // 方向(一开始朝右)
        this.direction = 1;

        // 水平方向和垂直方向的速度
        this.vx = 0;
        this.vy = 0;

        this.speedx = 400; // 水平初始速度,越大越快
        this.speedy = -1000;  // 跳起的初始速度，向上跳是负的，越小越高

        this.gravity = 50; // 重力

        this.ctx = this.root.game_map.ctx;
        this.pressed_keys = this.root.game_map.controller.pressed_keys;// 键盘按下去某个按键

        // 状态表示   0：idle, 1：向前，2：向后，3：跳跃，4：攻击，5：被打，6：死亡
        this.status = 3; // 初始状态从空中跳下来
        // 为了方便把每一个状态动作存放在map里面（动作多)
        this.animations = new Map();
        this.frame_current_cnt = 0;// 计数器，表示当前记录了多少帧

        this.hp = 100;// 血量
        this.$hp = this.root.$kof.find(`.kof-head-hp-${this.id}>div`);// 显示血条
        this.$hp_div = this.$hp.find('div');
    }

    start() {

    }

    update_move() {

        this.vy += this.gravity;// 重力加速度：每一秒中加gravity

        // 距离 = 时间 * 速度
        this.x += this.vx * this.timedelta / 1000; // timedelta是毫秒，记录每两针之间时间间隔
        this.y += this.vy * this.timedelta / 1000;

        // 落地停止
        if (this.y > 450) {
            this.y = 450;
            this.vy = 0;

            if (this.status === 3) this.status = 0;
        }

        // 左右移动不出界
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > this.root.game_map.$canvas.width()) {// 1280也可以
            this.x = this.root.game_map.$canvas.width() - this.width;
        }

    }

    update_control() {
        let w, a, d, space;
        if (this.id === 0) {
            // has()：返回是否包含某个元素
            w = this.pressed_keys.has('w');
            a = this.pressed_keys.has('a');
            d = this.pressed_keys.has('d');
            space = this.pressed_keys.has(' ');
        } else {
            w = this.pressed_keys.has('ArrowUp');
            a = this.pressed_keys.has('ArrowLeft');
            d = this.pressed_keys.has('ArrowRight');
            space = this.pressed_keys.has('Enter');
        }
        // 先判断跳和移动，如果跳起来就不能移动，跳是在0和1的状态下（1又包括2）
        if (this.status === 0 || this.status === 1) {
            if (space) {// 判断攻击
                this.status = 4;
                this.vx = 0;
                this.frame_current_cnt = 0; // 攻击时要初始化从第0帧开始渲染
            } else if (w) {// 跳跃：垂直跳，向前45°跳，向后45°跳
                if (d) {
                    this.vx = this.speedx;
                } else if (a) {
                    this.vx = -this.speedx;
                } else {
                    this.vx = 0;
                }
                // 垂直方向是固定的
                this.vy = this.speedy;
                this.status = 3; // 跳起状态
                this.frame_current_cnt = 0;
            } else if (d) {// 向前移动
                this.vx = this.speedx;
                this.status = 1;  // 向前向后状态都是1
            } else if (a) {// 向前移动
                this.vx = -this.speedx;
                this.status = 1;  // 向前向后状态都是1
            } else {
                this.vx = 0; // 没有按的时候速度为0
                this.status = 0; // 静止状态
            }
        }

    }

    update_direction() {// 判断左右实现对称
        if (this.status === 6) return;// 如果倒地了就不用与另一个人物变化方位

        let players = this.root.players;
        if (players[0] && players[1]) {
            let me = this, you = players[1 - this.id];
            if (me.x < you.x) me.direction = 1;
            else me.direction = -1;
        }

    }

    is_attack() { // 被攻击到了
        if (this.status === 6) return; // 倒地就不会再被攻击了

        this.status = 5; //被打
        this.frame_current_cnt = 0; // 从第0帧开始渲染

        this.hp = Math.max(0, this.hp - 10); // 与0取最大值避免出现负数

        this.$hp_div.animate({
            width: this.$hp.parent().width() * this.hp / 100
        }, 300);
        this.$hp.animate({
            width: this.$hp.parent().width() * this.hp / 100
        }, 600);


        if (this.hp <= 0) {
            this.status = 6;
            this.frame_current_cnt = 0;// 从第0帧开始渲染
            this.vx = 0;
        }
    }

    // 把有没有攻击到到看成两个矩形是否右碰撞 = 两矩阵水平方向右交集同时竖直方向有交集
    is_collision(r1, r2) {
        // 看成两个线段ab和cd，左端点取最大值max(a,c) ≤ 右端点最小值min(b,d)
        // x1左端点，x2右端点，y1\y2同理
        if (Math.max(r1.x1, r2.x1) > Math.min(r1.x2, r2.x2))
            return false;
        if (Math.max(r1.y1, r2.y1) > Math.min(r1.y2, r2.y2))
            return false;
        return true;
    }

    update_attack() {
        // 处于第四状态且拳头刚刚好伸直挥出去
        if (this.status === 4 && this.frame_current_cnt === 18) {
            let me = this, you = this.root.players[1 - this.id];
            let r1;// 自己手臂伸长的位置
            if (this.direction > 0) {
                r1 = {
                    x1: me.x + 120,// 左上角坐标
                    y1: me.y + 40,
                    x2: me.x + 120 + 100,// 右下角坐标
                    y2: me.y + 40 + 20,
                }
            } else {
                r1 = {
                    x1: me.x + me.width - 120 - 100,// 左上角坐标
                    y1: me.y + 40,
                    x2: me.x + me.width - 120 - 100 + 100,// 右下角坐标
                    y2: me.y + 40 + 20,
                };
            }

            let r2 = {
                x1: you.x,// 左上角坐标
                y1: you.y,
                x2: you.x + you.width,// 右下角坐标,左上角的横坐标 + 手臂的长度
                y2: you.y + you.height
            };

            // 判断有没 有攻击到
            if (this.is_collision(r1, r2)) {
                you.is_attack();
            }

        }
    }

    update() {
        this.update_control();
        this.update_move();
        this.update_direction();
        this.update_attack();

        this.rander();
    }

    rander() {
        // // 碰撞盒子，用于辅助设计有没有攻击到
        // this.ctx.fillStyle = 'blue';
        // this.ctx.fillRect(this.x, this.y, this.width, this.height);
        // if (this.direction > 0) {
        //     this.ctx.fillStyle = ' red';
        //     this.ctx.fillRect(this.x + 120, this.y + 40, 100, 20);
        // } else {
        //     this.ctx.fillStyle = ' red';
        //     this.ctx.fillRect(this.x + this.width - 120 - 100, this.y + 40, 100, 20);
        // }

        let status = this.status;

        // 判断是前进还是后退,方向和速度是不同方向就是后退
        if (this.status === 1 && this.direction * this.vx < 0) status = 2;

        let obj = this.animations.get(status);
        if (obj && obj.loaded) {
            if (this.direction > 0) {
                // 每5帧移动一次
                let k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt;
                let image = obj.gif.frames[k].image;
                // 左右移动加上偏移量
                this.ctx.drawImage(image, this.x, this.y + obj.offset_y, image.width * obj.scale, image.height * obj.scale);
            } else {
                // 通过变化坐标系实现反转，y不变x变成相反方向
                this.ctx.save();// 保存配置
                this.ctx.scale(-1, 1); //以Y轴 左右翻转
                // 画布X轴向右平移（负方向平移）画布大小，纵方向不变
                this.ctx.translate(-this.root.game_map.$canvas.width(), 0);

                let k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt;
                let image = obj.gif.frames[k].image;
                // (相对关系)人物关于画布中心对称对称之后还有一个人物宽度的偏移量（不减去回导致人物太中间）
                // 画布大小-人物的宽度-人物设定好的横坐标位置 = 相对坐标下的横坐标位置
                this.ctx.drawImage(image, this.root.game_map.$canvas.width() - this.x - this.width, this.y + obj.offset_y, image.width * obj.scale, image.height * obj.scale);
                this.ctx.restore();// 恢复配置
            }

        }
        // 只播放就结束的动作：跳跃、被打、死亡，死亡是倒地不起状态
        if (status === 4 || status === 5 || status === 6) {
            // 为什么要-1，因为每5帧播放一次图片，obj.frame_cnt - 1和obj.frame_cnt之间有1帧
            // 如果没有-1则是继续播放1帧开始帧的挥拳的动作，-1就让他播完最后一
            if (this.frame_current_cnt == obj.frame_rate * (obj.frame_cnt - 1)) {
                if (status === 6) {
                    this.frame_current_cnt--; //与下面的++相互抵消
                } else {
                    this.status = 0;// 挥完拳静止
                }
            }
        }

        this.frame_current_cnt++;
    }
}