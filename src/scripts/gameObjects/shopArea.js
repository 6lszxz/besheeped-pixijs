import {gameMap} from "@/scripts/gameObjects/gameMap";
import {systemValue} from "@/scripts/systems/systemValue";
import * as PIXI from "pixi.js";
import * as ui from "@/scripts/ui";
import {gameStage} from "@/scripts/gameSystem";

/**
 * 商店位置
 * @type {{itself: PIXI.Graphics, create(): void, startY: number, startX: number}}
 * @property startX number 左上角x坐标
 * @property startY number 左上角y坐标
 * @property itself PIXI.Graphics 本身，几何图形
 * @property create function 把商店背景显示出来
 */
let shopArea = {
    startX: gameMap.startX + systemValue.size * 7,
    startY: 0,
    itself: new PIXI.Sprite.from(ui.shopImg),
    create() {
        this.itself.zIndex = 5;
        this.itself.position.set(this.startX, this.startY);
        gameStage.itself.addChild(this.itself);
    }
}
export {shopArea};