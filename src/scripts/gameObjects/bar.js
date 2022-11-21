import {gameMap} from "@/scripts/gameObjects/gameMap";
import {systemValue} from "@/scripts/systems/systemValue";
import * as PIXI from "pixi.js";
import * as ui from "@/scripts/ui";
import {farmInformation} from "@/scripts/gameObjects/farmInformation";
import {gameStage, Tile} from "@/scripts/gameSystem";

/**
 * 合成槽
 * @type {{itself: PIXI.Graphics, toBarPosition(*): *, lengthNow: number, typeNumbers: Map<any, any>, create(): void, refresh(): void, checkMatch(): void, startY: number, maxSize: number, startX: number, checkFull(): void, tileLists: Map<any, any>}}
 * @property startX number 左上角横坐标
 * @property startY number 左上角纵坐标
 * @property itself PIXI.Graphics 合成槽本身
 * @property maxSize number 合成槽的最大大小
 * @property lengthNow number 合成槽目前的容量大小
 * @property tileLists Map 合成槽中的块种类
 * @property typeNumbers Map 各种块的数量
 * @property create function 在地图上创建合成槽
 * @property toBarPosition function 把合成槽中的位置转换成显示器上的坐标
 * @property refresh function 刷新合成槽
 * @property checkMatch function 判断是否满足了消除条件
 * @property checkFull function 判断合成槽是否已经满了
 */
let bar = {
    startX: gameMap.startX - systemValue.size / 2,
    startY: gameMap.startY + systemValue.size * 6.5,
    itself: new PIXI.Sprite.from(ui.barImg),
    maxSize: 7,
    lengthNow: 0,
    tileLists: new Map(),
    typeNumbers: new Map(),
    create() {
        for (let i = 0; i < Tile.types.length; i++) {
            bar.typeNumbers.set(`${Tile.types[i]}`, 0);
        }
        this.itself.zIndex = 5;
        this.itself.position.set(this.startX, this.startY);
        gameStage.itself.addChild(this.itself);
    },
    toBarPosition(value) {//输入数字
        return systemValue.size * (value - 1);
    },
    refresh() {
        for (let i = 1; i <= this.lengthNow; i++) {
            this.tileLists.get(i).itself.position.set(bar.toBarPosition(i), 0);
        }
    },
    checkMatch() {
        for (let i = 0; i < Tile.types.length; i++) {
            let tempNumber = bar.typeNumbers.get(Tile.types[i]);
            if (tempNumber >= 3) {
                while (tempNumber !== 0) {
                    for (let tile of bar.tileLists.values()) {
                        if (tile.id === Tile.types[i]) {
                            console.log(tile);
                            tile.removeFromBar();
                            break;
                        }
                    }
                    tempNumber = bar.typeNumbers.get(Tile.types[i]);
                }
                systemValue.setPointerNow(Tile.types[i]);
            }
        }
        bar.refresh();
        bar.checkFull();
    },
    checkFull() {
        console.log(bar.tileLists)
        if (bar.lengthNow === bar.maxSize) {
            farmInformation.coinBoard.change(-100);
            for (let i = 7; i > 2; i--) {
                bar.tileLists.get(i).removeFromBar();
            }
            bar.refresh();
        }
    }
}
export {bar};