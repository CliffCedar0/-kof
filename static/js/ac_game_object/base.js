let AC_GAME_OBJECTS = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);

        this.timedelta = 0; // 当前帧距离上一帧的时间间隔     
        this.has_call_start = false; // 表示当前对象有没有执行过start函数
    }

    start() { // 初始执行一次，用来初始化

    }

    update() { // 每一帧执行一次（除了第一帧以外）

    }

    destroy() { // 删除当前对象
        for (let i in AC_GAME_OBJECTS) {// in枚举下标
            if (AC_GAME_OBJECTS === this) {
                AC_GAME_OBJECTS.splice(i, 1);// splic删除元素，从i开始删除1个元素
                break;
            }
        }
    }
}

let last_timestamp; // 上一次的时间

let AC_GAME_OBJECTS_FRAME = (timestamp) => {// timestamp当前执行的时刻
    for (let obj of AC_GAME_OBJECTS) { // of枚举值
        if (!obj.has_call_start) {// 判断是否初始化
            obj.start();
            obj.has_call_start = true;
        } else {
            obj.timedelta = timestamp - last_timestamp;// 跟新timedatelta
            obj.update();
        }
    }
    last_timestamp = timestamp; // 跟新一下时上一次间

    //  requestAnimationFrame函数通过递归的方式实现每一帧执行一次
    requestAnimationFrame(AC_GAME_OBJECTS_FRAME);
}

requestAnimationFrame(AC_GAME_OBJECTS_FRAME); // 启动，启动后每一帧都在永无止境的执行

export {
    AcGameObject
}