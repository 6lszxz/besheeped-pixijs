import * as PIXI from 'pixi.js';
import * as contents from './contents';
import * as structures from './structures'
import { structureList } from './structureList';
import { shopButtonList } from './shopButtonList';

/**
 * 整个PIXI应用，所有的元素都应是这个应用的子元素
 * @type {PIXI.Application}
 */
const app = new PIXI.Application({
    backgroundColor : 0x90EE90,
});

// 以下都是系统流程中调用的函数
/**
 * 创建PIXI应用，包括设定背景，锁定大小，设定交互等
 * @function
 */
function createApp(){
    document.body.appendChild(app.view);
    app.renderer.view.style.position='absolute'
    app.renderer.view.style.display ='block';
    app.renderer.autoResize = true;
    app.renderer.resize(window.innerWidth,window.innerHeight);
    app.stage.interactive = true;
    init();
    app.stage.scale.set(systemValue.scaleX,systemValue.scaleY);
}
/**
 * 对应用内容进行初始化，包括加载资源、创建游戏舞台、刷新一个棋盘、把默认的羊放到牧场中，创建商店
 * @function
 */
function init(){
    Tile.loadContents();
    gameStage.create();
    gameMap.shuffleAll();
    structureSystem.createToMap('sheep');
    shopButton.createAll();
}
/**
 * 每次点击中进行的操作，包括把元素移动到合成槽中、创建新的元素，检测需求是否完成或失败、生成随机需求、日期移动等
 * @function
 * 鼠标所点击的那个块
 * @param tile {Tile}
 */
function tapLoop(tile){
    tile.moveToBar();
    gameMap.fallAndCreate(tile.x,tile.y);
    bar.checkMatch();
    itemRequire.checkSuccesses();
    itemRequire.lastingTimeChanges(1);
    itemRequire.checkFails();
    shopButton.checkCanBeBoughtAll();
    farmInformation.gameDate.pass();
    itemRequire.spawnRandomRequire();
}

// 以下都是需要的类
/**
 * @class
 * 块类
 */
class Tile {
    /**
     * 整个游戏中所有的块的图片。是一个数组
     * @type {[]}
     */
    static types =[];
    /**
     * 当前游戏中的块种类，是一个字符串集合
     * @type {*}
     */
    static typesNow = new Set();
    /**
     * 把参数中的块添加到当前游戏中，可以是多个参数，使用块名字的字符串
     * @param list {string}
     */
    static addToTypesNow(...list){
        for(let type of list){
            Tile.typesNow.add(type);
        }
    }
    /**
     * 加载资源，读取所有的图片文件，然后将初始的块添加到当前游戏中
     */
    static loadContents(){
        for(let content in contents){
            Tile.types.push(content);
        }
        Tile.addToTypesNow('corn', 'wheat', 'fiber', 'radish', 'strawberry');
        Tile.addToTypesNow('torch', 'wool', 'wood', 'sardine', 'shears');
        Tile.addToTypesNow('wateringCan', 'apple', 'clam',);
    }
    /**
     * 根据传入的字符串创造对应的块，如果传入'random'则在typesNow中随机抽
     * @param id {string}
     */
    constructor(id) {
        if(id==='random'){
            do{
                this.id = Tile.types[Math.floor(Math.random()*(Tile.types.length))];
            }while(gameMap.checkId(this.id) || !Tile.typesNow.has(this.id));          
        }else {
            this.id = id;
        }
    }
    /**
     * 根据传入的坐标把该块放入地图中，从左上角开始，X和Y均大于等于1且不超过6。
     * @param X {number}
     * 对应的横坐标
     * @param Y {number}
     * 对应的纵坐标
     */
    createToMap(X,Y){
        this.x=X;
        this.y=Y;
        this.itself = new PIXI.Sprite.from(contents[`${this.id}`]);
        this.itself.position.set(systemValue.toMapX(this.x),systemValue.toMapY(this.y));
        this.itself.interactive = true;
        this.itself.zIndex=10;
        gameMap.tileLists.set(`${this.x},${this.y}`,this);
        this.itself.on('pointertap', ()=>{
            tapLoop(this);
        });
        let lastNumber = gameMap.typeNumbers.get(this.id);
        lastNumber++;
        gameMap.typeNumbers.set(this.id,lastNumber);
        gameMap.itself.addChild(this.itself);
    }
    /**
     * 把当前块传入到合成槽中
     */
    moveToBar(){
        bar.lengthNow++;
        gameMap.itself.removeChild(this.itself);
        this.itself.interactive=false;
        this.itself.position.set(bar.toBarPosition(bar.lengthNow),0);
        bar.itself.addChild(this.itself);
        let addPosition = bar.lengthNow;
        for(let i=1;i<bar.lengthNow;i++){
            if(bar.tileLists[i].id===this.id){
                addPosition =i;
            }
        }
        bar.tileLists.splice(addPosition,0,this);
        bar.refresh();
        let lastNumber = bar.typeNumbers.get(this.id);
        lastNumber++;
        bar.typeNumbers.set(this.id,lastNumber);
        let tempNumber = gameMap.typeNumbers.get(this.id);
        tempNumber--;
        gameMap.typeNumbers.set(this.id,tempNumber);
    }
    /**
     * 把当前块从合成槽中移除
     */
    removeFromBar(){
        let tempPosition=1;
        for(let i=1;i<=bar.lengthNow;i++){
            if(bar.tileLists[i].id===this.id){
                tempPosition = i;
                break;
            }
        }
        bar.tileLists.splice(tempPosition,1);
        bar.itself.removeChild(this.itself);
        bar.lengthNow--;
        let id = this.id;
        let tempNumber = bar.typeNumbers.get(id);
        tempNumber--;
        bar.typeNumbers.set(id,tempNumber);
    }
}
/**
 * 结构体系统类，该类中全是静态方法，因为具体的结构实例可以在structueList中自定义
 */
class structureSystem{
    /**
     * 地图上当前的结构体集合，全部用结构体名称字符串存储
     * @type {Set<string>}
     */
    static structureNow = new Set();
    /**
     * 根据传入的字符串，把对应的结构体放入到structureNow中。
     * @param list {string}
     */
    static addToStructureNow(...list){
        for(let structure of list){
            this.structureNow.add(structure);
        }
    }

    /**
     * 根据传入的id，返回结构体实例
     * @param id {string}
     * 传入的id
     * @returns {{sizeX: number, willAddContent: boolean, requiring: string, canBeBoughtFromShop: boolean, startY: number, id: string, startX: number, sizeY: number, earning: number}|{sizeX: number, contentAdded: string, willAddContent: boolean, requiring: string, canBeBoughtFromShop: boolean, startY: number, id: string, startX: number, sizeY: number, earning: number}|{sizeX: number, contentAdded: string, willAddContent: boolean, requiring: string, canBeBoughtFromShop: boolean, startY: number, id: string, startX: number, sizeY: number, earning: number}|{contentAdded: string, willAddContent: boolean, requiring: string, canBeBoughtFromShop: boolean, startY: number, id: string, startX: number, earning: number}|{contentAdded: string, willAddContent: boolean, requiring: string, canBeBoughtFromShop: boolean, startY: number, id: string, startX: number, earning: number}|null}
     * 返回的结构对象，如果不存在则返回null
     */
    static getStructureById(id){
        for(let structure of structureList){
            if(id === structure.id){
                return structure;
            }
        }
        return null;
    }
    /**
     * 把传入的结构放在牧场中
     * @param id {string} 结构体名称
     */
    static createToMap(id){
        let structure = structureSystem.getStructureById(id);
        structure.itself = new PIXI.Sprite.from(structures[`${structure.id}`]);
        structure.itself.zIndex =10;
        structure.itself.position.set(systemValue.toMapX(structure.startX),systemValue.toMapY(structure.startY));
        farmArea.itself.addChild(structure.itself);
        structure.onRequiringNow = false;
        structureSystem.addToStructureNow(structure);
        if(structure.willAddContent){
            Tile.addToTypesNow(structure.contentAdded);
        }
    }
    /**
     * 让对应的结构体产生需求，持续时间为10回合
     * @param id {string} 结构名称
     */
    static spawnItemRequire(id){
        let structure = structureSystem.getStructureById(id);
        structure.onRequiringNow=true;
        itemRequire.requiringNow.add(new itemRequire(id,structure.requiring,10,structure.earning));
    }
}
/**
 * 需求类
 */
class itemRequire{
    /**
     * 整个牧场中目前的所有需求集合
     * @type {Set<itemRequire>}
     */
    static requiringNow = new Set();
    /**
     * 整个地图中随机产生需求，每个回合都有1/4的几率产生，每次只会产生一个，地图同时存在的需求不会超过当前结构数量的一半
     */
    static spawnRandomRequire(){
        console.log(`${itemRequire.requiringNow.size} ${structureSystem.structureNow.size/2}`)
        if(Math.floor(Math.random()*4)===1 && itemRequire.requiringNow.size< structureSystem.structureNow.size/2){ 
            let tempNumber = Math.floor(Math.random()*structureSystem.structureNow.size);
            let i=0;
            for(let structure of structureSystem.structureNow){
                if(i===tempNumber && !structure.onRequiringNow){
                        structureSystem.spawnItemRequire(structure.id);
                        break;
                }
                i++;
            }
        }
    }
    /**
     * 判断集合中的需求有没有成功的
     */
    static checkSuccesses(){
        for(let aRequire of itemRequire.requiringNow){
            aRequire.checkSuccess();
        }
    }
    /**
     * 判断集合中的需求有没有失败的
     */
    static checkFails(){
        for(let aRequire of itemRequire.requiringNow){
            aRequire.checkFail();
        }
    }
    /**
     * 减少集合的倒计时
     * @param week
     * 减少的值，通常来讲都是1
     */
    static lastingTimeChanges(week){
        for(let aRequire of itemRequire.requiringNow){
            aRequire.lastingTimeChange(week);
        }
    }
    /**
     * 创建需求，和Tile类不同的是new一个出来之后直接就在地图上了
     * @param from {string}
     * 产生需求的那个结构名称
     * @param id {string}
     * 需要的元素名称
     * @param lastingTime {number}
     * 持续时间
     * @param earning {number}
     * 完成后获得的金币数
     */
    constructor(from, id, lastingTime, earning){
        this.id = id;
        this.lastingTime = lastingTime;
        this.earning = earning;
        this.from = from;
        this.positionX = structureSystem.getStructureById(from).startX;
        this.positionY = structureSystem.getStructureById(from).startY-1;
        this.itself = new PIXI.Graphics();
        this.itself.beginFill(0x777777);
        this.itself.zIndex = 10;
        this.itself.position.set(systemValue.toMapX(this.positionX),systemValue.toMapY(this.positionY));
        this.itself.drawRect(0,0,systemValue.size*1,systemValue.size*1);
        farmArea.itself.addChild(this.itself);
        this.requiringContent = new PIXI.Sprite.from(contents[`${this.id}`]);
        this.requiringContent.position.set(0,0);
        this.requiringContent.zIndex = 15;
        this.itself.addChild(this.requiringContent);
        this.lastText = new PIXI.Text(`${this.lastingTime}`);
        this.lastText.position.set(0,0);
        this.lastText.zIndex =20;
        this.itself.addChild(this.lastText);
    }
    /**
     * 判断单个需求是否成功
     */
    checkSuccess(){
        if(this.id === systemValue.pointerNow){
            let structure = structureSystem.getStructureById(this.from);
            structure.onRequiringNow = false;
            farmInformation.coinBoard.change(this.earning);
            farmArea.itself.removeChild(this.itself);
            itemRequire.requiringNow.delete(this);
        }
        
    }
    /**
     * 减少单个需求的倒计时
     * @param week
     * 减小的数值，默认应该都是1
     */
    lastingTimeChange(week){
        this.lastingTime -= week;
        this.lastText.text =`${this.lastingTime}`;
    }
    /**
     * 判断单个需求是否失败，失败后会扣掉该需求报酬的一半
     */
    checkFail(){
        if(this.lastingTime<0){
            let structure = structureSystem.getStructureById(this.from);
            structure.onRequiringNow = false;
            farmInformation.coinBoard.change(-this.earning/2);
            farmArea.itself.removeChild(this.itself);
            itemRequire.requiringNow.delete(this);
        }
    }
}
/**
 * 商店按钮类
 */
class shopButton{
    /**
     * 商店按钮的总个数，通过编辑shopButtonList来自定义
     * @type {number}
     */
    static buttonsNumber = shopButtonList.length;
    /**
     * 把所有的商店按钮显示在游戏中
     */
    static createAll(){
        for(let i=0;i<shopButton.buttonsNumber;i++){
            let buttonNow = shopButtonList[i];
            buttonNow.isBought = false;
            buttonNow.canBeBought = false;
            buttonNow.itself = new PIXI.Graphics();
            buttonNow.itself.beginFill(0x584783);
            buttonNow.itself.zIndex =10;
            buttonNow.itself.position.set(0,systemValue.toMapY(i===0?i+1:i*2+1));
            buttonNow.itself.drawRoundedRect(0,0,systemValue.size*6,systemValue.size*1.5);
            shopArea.itself.addChild(buttonNow.itself);
            buttonNow.titleText = new PIXI.Text(`${buttonNow.name}\n 花费：${buttonNow.cost}，现在没钱`);
            buttonNow.titleText.position.set(10,0);
            buttonNow.titleText.zIndex =15;
            buttonNow.itself.addChild(buttonNow.titleText);
        }
    }
    /**
     * 检测是否达到了购买的条件
     */
    static checkCanBeBoughtAll(){
        for(let i=0;i<shopButton.buttonsNumber;i++){
            let buttonNow = shopButtonList[i];
            if(farmInformation.coinBoard.coin>=buttonNow.cost && (!buttonNow.isBought)){
                buttonNow.titleText.text= `${buttonNow.name}\n 花费：${buttonNow.cost}，点击购买`
                buttonNow.canBeBought = true;
                buttonNow.itself.interactive = true;
                buttonNow.itself.on('pointertap',()=>{
                    if(farmInformation.coinBoard.coin>=buttonNow.cost && (!buttonNow.isBought)){
                        console.log('isTouched');
                        if(buttonNow.type === 'structure'){
                            structureSystem.createToMap(buttonNow.name);
                        }
                        farmInformation.coinBoard.change(-(buttonNow.cost));
                        buttonNow.titleText.text= `${buttonNow.name}\n 已购买`
                        buttonNow.isBought = true;
                    }
                });         
            }else{
                buttonNow.titleText.text= `${buttonNow.name}\n 花费：${buttonNow.cost}，现在没钱`
                buttonNow.canBeBought = false;
            }
        }
    }
}

//以下是单个物体们
/**
 * 系统变量，包括精灵缩放大小、 每个块的像素数、最近一次消除的元素名称等
 * @type {{scaleX: number, scaleY: number, size: number, pointerNow: string, toMapX(*): *, setPointerNow(*): void, toMapY(*): *}}
 * @property number size 块的像素数，根据星露谷这边的素材，因此用的就是48
 * @property number scaleX X轴缩放
 * @property number scaleY Y轴缩放
 * @property string pointerNow 最近消除的元素名称
 * @property setPointerNow 更改最近消除的元素名称
 * @property toMapX 把传入的x坐标变成显示器上的全局坐标
 * @property toMapY 把传入的y坐标变成显示器上的全局坐标
 */
let systemValue={
    size :48,
    scaleX : window.innerWidth/1920,
    scaleY : window.innerHeight/1080,
    pointerNow : '',
    setPointerNow(id){
        systemValue.pointerNow = id;
    },
    toMapX(x){
        return (x-1)*systemValue.size;
    },
    toMapY(y){
        return (y-1)*systemValue.size;
    },
}
/**
 * 游戏舞台，放所有者东西的地方
 * @type {{positionY: number, itself: Container, create(): void, positionX: number}}
 * @property itself PIXI.Container 创建的PIXI容器
 * @property positionX number 左上角顶点横坐标
 * @property positionY number 左上角顶点纵坐标
 * @property create 把游戏舞台创建到app上
 */
let gameStage = {
    itself : new PIXI.Container(),
    positionX : (window.innerWidth-24*systemValue.size*systemValue.scaleX)/2,
    positionY : (window.innerHeight-12*systemValue.size*systemValue.scaleY)/2,
    create(){
        this.itself.position.set(this.positionX, this.positionY);
        app.stage.addChild(this.itself);
        farmArea.create();
        gameMap.create();
        bar.create();
        farmInformation.create();
        shopArea.create();
    },
}
/**
 * 牧场区域，是放结构和产生需求的地方
 * @type {{positionY: number, itself: PIXI.Graphics, create(): void, positionX: number}}
 * @property itself PIXI.Graphics 牧场背景
 * @property positionX number 左上角顶点横坐标
 * @property positionY number 左上角顶点纵坐标
 * @property create 把牧场区域创建到游戏舞台上
 */
let farmArea ={
    itself : new PIXI.Graphics(),
    positionX : 0,
    positionY : 0,
    endPositionX : systemValue.size *10,
    create(){
        this.itself.beginFill(0x66CCFF);
        this.itself.position.set(this.positionX, this.positionY);
        this.itself.drawRect(0,0,systemValue.size*10,systemValue.size*12);
        this.itself.zIndex = 5;
        gameStage.itself.addChild(this.itself);
    },
}

let farmInformation ={
    startX : farmArea.endPositionX+systemValue.size*1,
    startY : 0,
    itself : new PIXI.Graphics(),
    endPositionX :farmArea.endPositionX+systemValue.size*7,
    endPositionY : systemValue.size*3, 
    coinBoard : {
        startX : 10,
        startY : 10,
        itself : new PIXI.Text(),
        coin : 500,
        create(){
            this.itself.position.set(this.startX,this.startY);
            farmInformation.itself.addChild(this.itself);
            this.itself.text = `金币：${this.coin}`;
        },
        change(value){
            console.log(value);
            console.log(this.coin)
            this.coin += value;
            this.itself.text = `金币：${this.coin}`;
        }
    },
    gameDate :{
        startX :10,
        startY : 50,
        itself : new PIXI.Text(),
        year : 1,
        week : 1,
        create(){
            this.itself.position.set(this.startX,this.startY);
            farmInformation.itself.addChild(this.itself);
            this.itself.text = `第${this.year}年，第${this.week}周`;
        },
        pass(){
            this.week++;
            if(this.week>52){
                this.week=1;
                this.year++;
            }
            this.itself.text = `第${this.year}年，第${this.week}周`;
        }
    },
    create() {
        this.itself.beginFill(0x66CCFF);
        this.itself.zIndex =5;
        this.itself.position.set(this.startX,this.startY);
        this.itself.drawRect(0,0,systemValue.size*6,systemValue.size*3);
        gameStage.itself.addChild(this.itself);
        this.coinBoard.create();
        this.gameDate.create();
    }
}

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
let gameMap={
    startX : farmArea.endPositionX+systemValue.size*1,
    startY : farmInformation.endPositionY +systemValue.size*1,
    itself : new PIXI.Graphics(),
    tileLists : new Map(),
    typeNumbers : new Map(),
    create(){
        for(let i=0;i<Tile.types.length;i++){
            gameMap.typeNumbers.set(Tile.types[i],0);
        }
        this.itself.beginFill(0x66CCFF);
        this.itself.position.set(this.startX, this.startY);
        this.itself.drawRect(0,0,systemValue.size*6,systemValue.size*6);
        this.itself.zIndex = 5;
        gameStage.itself.addChild(this.itself);
    },
    fallAndCreate(X,Y){
        if(Y!==0){
            for(let i=Y-1;i>=1;i--){
                gameMap.tileLists.set(`${X},${i+1}`,gameMap.tileLists.get(`${X},${i}`));
                let tempTile =gameMap.tileLists.get(`${X},${i+1}`);
                tempTile.itself.position.set(systemValue.toMapX(X),systemValue.toMapY(i+1));
                tempTile.y++;
            }
            gameMap.tileLists.set(`${X},1`,new Tile('random'));
            let tempTile =gameMap.tileLists.get(`${X},1`);
            tempTile.createToMap(X,1);
        }
    },
    shuffleAll(){
        for(let i=1;i<=6;i++){
            for (let j=1;j<=6;j++){
                let tile = new Tile('random');
                tile.createToMap(i,j);
            }
        }
    },
    checkId(id){
        return gameMap.typeNumbers.get(id)>=3;
    }
}

let bar={
    startX : gameMap.startX-systemValue.size/2,
    startY : gameMap.startY+systemValue.size*6.5,
    itself : new PIXI.Graphics(),
    maxSize : 7,
    lengthNow : 0,
    tileLists : [''],
    typeNumbers : new Map(),
    create(){
        for(let i=0;i<Tile.types.length;i++){
            bar.typeNumbers.set(`${Tile.types[i]}`,0);
        }
        this.itself.beginFill(0x66CCFF);
        this.itself.zIndex = 5;
        this.itself.position.set(this.startX,this.startY);
        this.itself.drawRect(0,0,systemValue.size*7,systemValue.size);
        gameStage.itself.addChild(this.itself);
    },
    toBarPosition(value){
        return systemValue.size*(value-1);
    },
    refresh(){
        for(let i=1;i<= this.lengthNow;i++){
            this.tileLists[i].itself.position.set(bar.toBarPosition(i),0);
        }
    },
    checkMatch(){
        for(let i=0;i<Tile.types.length;i++){
            let tempNumber = bar.typeNumbers.get(Tile.types[i]);
            if(tempNumber>=3){
                while(tempNumber!==0){
                    for(let tile of bar.tileLists){
                        if(tile.id ===Tile.types[i]){
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
    checkFull(){
        console.log(bar.tileLists)
        if(bar.lengthNow===bar.maxSize){
            farmInformation.coinBoard.change(-100);
            for(let i=7;i>2;i--){
                bar.tileLists[i].removeFromBar();
            }
            bar.refresh();
        }
    }
}

let shopArea={
    startX : gameMap.startX + systemValue.size*7,
    startY : 0,
    itself : new PIXI.Graphics(),
    create(){
        this.itself.beginFill(0x66CCFF);
        this.itself.zIndex =5;
        this.itself.position.set(this.startX,this.startY);
        this.itself.drawRect(0,0,systemValue.size*6,systemValue.size*12);
        gameStage.itself.addChild(this.itself);
    }
}

export {createApp,app}