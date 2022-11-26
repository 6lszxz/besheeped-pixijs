import * as PIXI from "pixi.js";
import * as ui from "@/scripts/ui";
import {app, init} from "@/scripts/gameSystem";

let RuleArea = {
    itself: new PIXI.Sprite.from(ui.ruleImg),
    button: new PIXI.Text('开始吧！'),
    create() {
        this.itself.position.set(window.innerWidth / 2-600, 0);
        this.button.position.set(window.innerWidth / 2, window.innerHeight *6/8);
        app.stage.addChild(this.itself);
        app.stage.addChild(this.button);
        this.button.interactive = true;
        this.button.on('pointertap', () => {
            init();
            app.stage.removeChild(this.itself);
            app.stage.removeChild(this.button);
        });
    }
}
export {RuleArea};