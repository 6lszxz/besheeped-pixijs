import {farmArea} from "@/scripts/gameObjects/farmArea";
import {systemValue} from "@/scripts/systems/systemValue";
import {farmInformation} from "@/scripts/gameObjects/farmInformation";
import * as PIXI from "pixi.js";
import * as ui from "@/scripts/ui";
import {gameStage, Tile} from "@/scripts/gameSystem";

/**
 * 游戏地图，就是那个6*6的格子
 * @type {{itself: PIXI.Graphics, shuffleAll(): void, typeNumbers: Map<any, any>, create(): void, startY: number, startX: number, checkId(*): boolean, fallAndCreate(*, *): void, tileLists: Map<any, any>}}
 * @property itself PIXI.Graphics 游戏地图背景
 * @property positionX number 左上角顶点横坐标
 * @property positionY number 左上角顶点纵坐标
 * @property tileLists Map 地图各个部分的块映射，键为`${x},${y}`
 * @property typeNumbers Map 地图上特定id的块有多少个
 * @property create 把游戏地图创建到游戏舞台上
 * @property fallAndCreate 消除之后把上面的落下来，然后创建一个新的
 * @property shuffleAll 生成一个棋盘
 * @property checkId 检测棋盘上特定的块个数是否大于等于3
 */
let gameMap = {
    startX: farmArea.endPositionX + systemValue.size * 1,
    startY: farmInformation.endPositionY + systemValue.size * 1,
    itself: new PIXI.Sprite.from(ui.mapImg),
    tileLists: new Map(),
    typeNumbers: new Map(),
    create() {
        for (let i = 0; i < Tile.types.length; i++) {
            gameMap.typeNumbers.set(Tile.types[i], 0);
        }
        this.itself.position.set(this.startX, this.startY);
        this.itself.zIndex = 5;
        gameStage.itself.addChild(this.itself);
    },
    fallAndCreate(X, Y) {
        if (Y !== 0) {
            for (let i = Y - 1; i >= 1; i--) {
                gameMap.tileLists.set(`${X},${i + 1}`, gameMap.tileLists.get(`${X},${i}`));
                let tempTile = gameMap.tileLists.get(`${X},${i + 1}`);
                tempTile.itself.position.set(systemValue.toMapX(X), systemValue.toMapY(i + 1));
                tempTile.y++;
            }
            gameMap.tileLists.set(`${X},1`, new Tile('random'));
            let tempTile = gameMap.tileLists.get(`${X},1`);
            tempTile.createToMap(X, 1);
        }
    },
    shuffleAll() {
        for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
                let tile = new Tile('random');
                tile.createToMap(i, j);
            }
        }
    },
    checkId(id) {
        return gameMap.typeNumbers.get(id) >= 3;
    }
}
export {gameMap};