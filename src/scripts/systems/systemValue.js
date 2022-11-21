//以下是单个物体们
/**
 * 系统变量，包括精灵缩放大小、 每个块的像素数、最近一次消除的元素名称等
 * @type {{scaleX: number, scaleY: number, size: number, pointerNow: string, toMapX(*): *, setPointerNow(*): void, toMapY(*): *}}
 * @property number size 块的像素数，根据星露谷这边的素材，因此用的就是48
 * @property number scaleX X轴缩放
 * @property number scaleY Y轴缩放
 * @property string pointerNow 最近消除的元素名称
 * @property setPointerNow function 更改最近消除的元素名称
 * @property toMapX function 把传入的x坐标变成显示器上的全局坐标
 * @property toMapY function 把传入的y坐标变成显示器上的全局坐标
 */
let systemValue = {
    size: 48,
    scaleX: window.innerWidth / 1920,
    scaleY: window.innerHeight / 1080,
    pointerNow: '',
    setPointerNow(id) {
        systemValue.pointerNow = id;
    },
    toMapX(x) {
        return (x - 1) * systemValue.size;
    },
    toMapY(y) {
        return (y - 1) * systemValue.size;
    },
}
export {systemValue};