import * as PIXISound from "@pixi/sound";
import * as sounds from "@/scripts/sounds";

let soundSystem = {
    init() {
        PIXISound.sound.add('click', sounds.soundTapTile);
        PIXISound.sound.add('BGM1', sounds.BGM1);
        PIXISound.sound.add('BGM2', sounds.BGM2);
        PIXISound.sound.add('BGM3', sounds.BGM3);
        PIXISound.sound.add('BGM4', sounds.BGM4);
        PIXISound.sound.add('BGM5', sounds.BGM5);
        PIXISound.sound.add('BGM6', sounds.BGM6);
        PIXISound.sound.add('BGM7', sounds.BGM7);
    },
    BGM() {
        let BGMrandom = ['BGM1', 'BGM2', 'BGM3', 'BGM4', 'BGM5', 'BGM6', 'BGM7'];
        let i = getRandomInt(0, 6);
        PIXISound.sound.play(BGMrandom[i], soundSystem.BGM);

    },
    clickMusic() {
        PIXISound.sound.play('click');
    }
}

/**
 * 随机生成数字
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    let rand1 = Math.floor(Math.random() * (max - min + 1)) + min;//注意加一
    return rand1;
}

export {soundSystem};