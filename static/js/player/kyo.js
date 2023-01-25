import { player } from '/static/js/player/base.js';
import { GIF } from '/static/js/util/gif.js';

export class Kyo extends player {
    constructor(root, info) {
        super(root, info);

        this.init_animations();
    }

    // 初始化动作动画
    init_animations() {
        let outer = this;// 用constructor里面的this
        let offset = [0, -22, -22, -140, 0, 0, 0]; // 偏移量1前进、2后退、3跳跃
        // 7个动画
        for (let i = 0; i < 7; i++) {
            // gif网址 https://stackoverflow.com/questions/48234696/how-to-put-a-gif-with-canvas
            let gif = GIF();
            gif.load(`/static/images/player/kyo/${i}.gif`);
            this.animations.set(i, {
                gif: gif,
                frame_cnt: 0,  // 总图片数
                frame_rate: 5,  // 每5帧过度一次,刷帧的速率
                offset_y: offset[i],  // y方向偏移量
                loaded: false,  // 是否加载完整
                scale: 2,  // 放大多少倍,缩放
            });

            // 图片加载完之后，把他更新一下
            gif.onload = function () {
                let obj = outer.animations.get(i);
                obj.frame_cnt = gif.frames.length;
                obj.loaded = true;// 已经被加载进来了

                if (i === 3) {// 修改跳跃速度使其变快
                    obj.frame_rate = 4;// 刷帧的速率
                }
            }

        }
    }
}