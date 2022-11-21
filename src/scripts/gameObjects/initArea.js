import * as PIXI from "pixi.js";
import * as ui from "@/scripts/ui";
import {systemValue} from "@/scripts/systems/systemValue";
import {app} from "@/scripts/gameSystem";
import {RuleArea} from "@/scripts/gameObjects/ruleArea";

let initArea = {
    logo: {
        itself: new PIXI.Sprite.from(ui.logoImg),
        positionX: window.innerWidth / 2 - 518 / 2 * systemValue.scaleX,
        positionY: window.innerHeight / 3,
        create() {
            this.itself.position.set(this.positionX, this.positionY);
            app.stage.addChild(this.itself);
        },
        destory() {
            app.stage.removeChild(this.itself);
        },
    },
    button: {
        itself: new PIXI.Text('开始游戏'),
        positionX: window.innerWidth / 2,
        positionY: window.innerHeight * 2 / 3,
        create() {
            this.itself.position.set(this.positionX, this.positionY);
            app.stage.addChild(this.itself);
        }
    },
    create() {
        this.logo.create();
        this.button.create();
        this.button.itself.interactive = true;
        this.button.itself.on('pointertap', () => {
            this.logo.destory();
            RuleArea.create();
            app.stage.removeChild(this.button.itself);
        })
    }

}
export {initArea};