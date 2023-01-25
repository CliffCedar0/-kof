export class controller {
    constructor($canvas) {
        this.$canvas = $canvas;

        this.pressed_keys = new Set();// set表示当前按住的键
        this.strart();
    }

    strart() {
        let outer = this;
        // 按下可能回按很多次，某个键被按住添加的时候到set当中
        this.$canvas.keydown(function (e) {
            outer.pressed_keys.add(e.key);
        });

        this.$canvas.keyup(function (e) {// 某个按键被释放的时候从set当中删除
            outer.pressed_keys.delete(e.key);
        });
    }
}