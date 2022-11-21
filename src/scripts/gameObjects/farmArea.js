import * as PIXI from "pixi.js";
import * as ui from "@/scripts/ui";
import {systemValue} from "@/scripts/systems/systemValue";
import {gameStage} from "@/scripts/gameSystem";

/**
 * 牧场区域，是放结构和产生需求的地方
 * @type {{positionY: number, itself: PIXI.Graphics, create(): void, positionX: number}}
 * @property itself PIXI.Graphics 牧场背景
 * @property positionX number 左上角顶点横坐标
 * @property positionY number 左上角顶点纵坐标
 * @property create function 把牧场区域创建到游戏舞台上
 */
let farmArea = {
    itself: new PIXI.Sprite.from(ui.farmImg),
    positionX: 0,
    positionY: 0,
    endPositionX: systemValue.size * 10,
    create() {
        this.itself.position.set(this.positionX, this.positionY);
        this.itself.zIndex = 5;
        gameStage.itself.addChild(this.itself);
    },
}
export {farmArea};