import {farmArea} from "@/scripts/gameObjects/farmArea";
import {systemValue} from "@/scripts/systems/systemValue";
import * as PIXI from "pixi.js";
import * as ui from "@/scripts/ui";
import {gameStage} from "@/scripts/gameSystem";

/**
 * 牧场信息，就是放金币和游戏时间（现在是第几年第几周的地方）
 * @type {{itself: PIXI.Graphics, gameDate: {itself: PIXI.Text, week: number, year: number, pass(): void, create(): void, startY: number, startX: number}, coinBoard: {itself: PIXI.Text, change(*): void, create(): void, startY: number, startX: number, coin: number}, endPositionY: number, endPositionX: number, create(): void, startY: number, startX: number}}
 * @property startX number 牧场信息框的左上角横坐标
 * @property startY number 牧场信息框的左上角纵坐标
 * @property itself PIXI.Graphics 信息框奔赴，是一个画的几何图形
 * @property coinBoard Object 金币信息
 * @property gameDate Object 游戏日期，一个回合为一周
 */
let farmInformation = {
    startX: farmArea.endPositionX + systemValue.size * 1,
    startY: 0,
    itself: new PIXI.Sprite.from(ui.informationImg),
    endPositionX: farmArea.endPositionX + systemValue.size * 7,
    endPositionY: systemValue.size * 3,
    /**
     * 金币信息
     * @property startX number 左上角横坐标
     * @property startY number 左上角纵坐标
     * @property itself PIXI.Text 金币的文本
     * @property create function 创建到画面上
     * @property change function 改变所持的金币值，正数为增负数为减
     */
    coinBoard: {
        startX: 10,
        startY: 10,
        itself: new PIXI.Text(),
        coin: 50,
        create() {
            this.itself.position.set(this.startX, this.startY);
            farmInformation.itself.addChild(this.itself);
            this.itself.text = `金币：${this.coin}`;
        },
        change(value) {
            console.log(value);
            console.log(this.coin)
            this.coin += value;
            this.itself.text = `金币：${this.coin}`;
        }
    },
    gameDate: {
        startX: 10,
        startY: 50,
        itself: new PIXI.Text(),
        year: 1,
        week: 1,
        create() {
            this.itself.position.set(this.startX, this.startY);
            farmInformation.itself.addChild(this.itself);
            this.itself.text = `第${this.year}年，第${this.week}周`;
        },
        pass() {
            this.week++;
            if (this.week > 52) {
                this.week = 1;
                this.year++;
            }
            this.itself.text = `第${this.year}年，第${this.week}周`;
        }
    },
    create() {
        this.itself.zIndex = 5;
        this.itself.position.set(this.startX, this.startY);
        gameStage.itself.addChild(this.itself);
        this.coinBoard.create();
        this.gameDate.create();
    }
}
export {farmInformation};