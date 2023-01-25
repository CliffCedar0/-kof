import { AcGameObject } from '/static/js/ac_game_object/base.js';
import { controller } from '/static/js/controller/base.js';

class GameMap extends AcGameObject {
    constructor(root) {
        super();// 继承自其他元素要写上构造函数

        this.root = root
        this.$canvas = $('<canvas width="1280" height="720" tabindex=0></canvas>');
        // tabindex 聚焦在canvas上面
        this.ctx = this.$canvas[0].getContext('2d');
        // jquery里面的canvas是一个数组
        this.root.$kof.append(this.$canvas);
        this.$canvas.focus();
        // canvas用jquery去取得时候如果定义成let 别去加this因为canvas并不是成员变量
        // 如果定义成this.canvas可以加this。不然 $canvas找不到focus这个函数

        this.controller = new controller(this.$canvas);

        // 用div实现血条和计时器
        this.root.$kof.append($(`<div class="kof-head">
        <div class="kof-head-hp-0"><div><div></div></div></div>
        <div class="kof-head-timer">60</div>
            <div class="kof-head-hp-1"><div><div></div></div></div>
        </div>`));

        this.time_left = 60000;  // 单位：毫秒
        this.$timer = this.root.$kof.find(".kof-head-timer");

    }

    // 地图每一帧都要清空一遍
    start() {

    }

    update() {
        this.time_left -= this.timedelta;
        if (this.time_left < 0) {
            this.time_left = 0;

            let [a, b] = this.root.players;
            if (a.status !== 6 && b.status !== 6) {
                a.status = b.status = 6;
                a.frame_current_cnt = b.frame_current_cnt = 0;
                a.vx = b.vx = 0;
            }
        }

        this.$timer.text(parseInt(this.time_left / 1000));

        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        // this.ctx.fillStyle = 'black';
        // this.ctx.fillRect(0, 0, this.$canvas.width(), this.$canvas.height());
    }
}

export {
    GameMap
}