import {soundSystem} from "@/scripts/systems/soundSystem";
import {bar} from "@/scripts/gameObjects/bar";
import {systemValue} from "@/scripts/systems/systemValue";
import {gameMap} from "@/scripts/gameObjects/gameMap";

/**
 * 实现动画效果
 */
function getMove(a, callback) {//传入参数为具体的方格，在合成槽放的第几个位置
    soundSystem.clickMusic();
    let isAddedBefore = false;
    let endatat = 0;//记录在合成槽的第几个放元素
    for (let i = 1; i <= bar.lengthNow; i++) {
        if (bar.tileLists.get(i).id === a.id) {
            isAddedBefore = true;
            endatat = i + 1;
            break;
        }
    }
    if (!isAddedBefore) {
        endatat = bar.lengthNow + 1;
    }
    let endx = (endatat - 1) * 48 - 24;//合成槽在方格的对应坐标
    let endy = 312;//同上,312
    let ax = systemValue.toMapX(a.x);
    let ay = systemValue.toMapY(a.y);
    let time = setInterval(function () {
        if (ax === endx && ay === endy) {
            gameMap.itself.removeChild(a.itself);
            clearInterval(time);
            callback();
        } else {
            var walkx = (endx - ax) / 4;
            if (walkx > 0) {
                walkx = Math.ceil(walkx);
            } else {
                walkx = Math.floor(walkx);
            }
            var walky = (endy - ay) / 3;
            if (walky > 0) {
                walky = Math.ceil(walky);
            } else {
                walky = Math.floor(walky);
            }
            a.itself.zIndex = 10;
            a.itself.position.set(ax + walkx, ay + walky);
            gameMap.itself.addChild(a.itself);
            ax += walkx;
            ay += walky;
        }

    }, 20)
}

export {getMove};