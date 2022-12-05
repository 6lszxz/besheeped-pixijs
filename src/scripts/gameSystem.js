import * as PIXI from 'pixi.js';
import * as contents from './contents';
import * as structures from './structures'
import { structureList } from './structureList';
import { shopButtonList } from './shopButtonList';
import * as sounds from './sounds';
import * as PIXISound from '@pixi/sound';
import * as ui from './ui';
import * as random from './randomEvent'
/**
 * 整个PIXI应用，所有的元素都应是这个应用的子元素
 * @type {PIXI.Application}
 */
const app = new PIXI.Application({
    backgroundColor : 0x90EE90,
});

// 版本号
let versionNumber='beta 1.1.1\npowered by 6lszxz, Xingxinyuxxy, qxr001, lzj26 and lwnzzz';

// 以下都是系统流程中调用的函数
/**
 * 创建PIXI应用，包括设定背景，锁定大小，设定交互等
 * @function
 */
function createApp(){
    if(window.innerWidth<window.innerHeight){
        alert('请不要使用竖屏进行游戏！');
        window.top.close();
    }
    // 给HTML文档添加WebGL画布
    document.body.appendChild(app.view);
    // 设定画面格式以及交互
    app.renderer.view.style.position='absolute'
    app.renderer.view.style.display ='block';
    app.renderer.autoResize = true;
    app.renderer.resize(window.innerWidth,window.innerHeight);
    app.stage.interactive = true;
    initArea.create();
    app.stage.scale.set(systemValue.scaleX,systemValue.scaleY);
}
/**
 * 对应用内容进行初始化，包括加载资源、创建游戏舞台、刷新一个棋盘、把默认的羊放到牧场中，创建商店
 * @function
 */
function init(){
    soundSystem.init();
    let version = new PIXI.Text(versionNumber);
    Tile.loadContents();
    gameStage.create();
    gameMap.shuffleAll();
    structureSystem.createToMap('sheep');
    shopButton.createPage(1);
    shopButton.createTurnPageButton();
    app.stage.addChild(version);
    soundSystem.BGM();
}
/**
 * 每次点击中进行的操作，包括把元素移动到合成槽中、创建新的元素，检测需求是否完成或失败、生成随机需求、日期移动等
 * @function
 * 鼠标所点击的那个块
 * @param tile {Tile}
 */
function tapLoop(tile){
    getMove(tile,function (){
        tile.moveToBar();
        bar.checkMatch();
        gameMap.fallAndCreate(tile.x,tile.y);
        randomEvent.create();
        randomEvent.achieve();
        itemRequire.checkSuccesses();
        itemRequire.lastingTimeChanges(1);
        itemRequire.checkFails();
        farmInformation.gameDate.pass();
        itemRequire.spawnRandomRequire();
        shopButton.checkCanBeBoughtAll();
    });

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
        this.itself = new PIXI.Sprite.from(contents[`${this.id}`]);//创建一个新的
        this.itself.position.set(systemValue.toMapX(this.x),systemValue.toMapY(this.y));//位置
        this.itself.interactive = true;
        this.itself.zIndex=10;
        gameMap.tileLists.set(`${this.x},${this.y}`,this);
        this.itself.on('pointertap', ()=>{
            tapLoop(this);
        });
        let lastNumber = gameMap.typeNumbers.get(this.id);
        lastNumber++;
        gameMap.typeNumbers.set(this.id,lastNumber);
        gameMap.itself.addChild(this.itself);//创建
    }
    /**
     * 把当前块传入到合成槽中
     */
    moveToBar(){
        let isAddedBefore = false;
        for(let i=1;i<=bar.lengthNow;i++){
            if(bar.tileLists.get(i).id ===this.id ){
                isAddedBefore = true;
                for(let j=bar.lengthNow+1;j>i+1;j--){
                    bar.tileLists.set(j,bar.tileLists.get(j-1));
                }
                bar.tileLists.set(i+1,this);
                break;
            }
        }
        if(!isAddedBefore){
            bar.tileLists.set(bar.lengthNow+1,this);
        }
        bar.lengthNow++;
        bar.refresh();
        console.log(bar.tileLists);
        let lastNumber = bar.typeNumbers.get(this.id);
        lastNumber++;
        bar.typeNumbers.set(this.id,lastNumber);
        let tempNumber = gameMap.typeNumbers.get(this.id);
        tempNumber--;
        gameMap.typeNumbers.set(this.id,tempNumber);
        bar.itself.addChild(this.itself);//创建对象到合成槽中
        this.itself.interactive=false;
        //随机事件 寒潮
        if(randomEvent.isColdWave>0)
        {
            randomEvent.isColdWave-=1;
        }else
        {
            for(let i=1;i<=6;i++)//恢复被冻结的元素
            {
                for(let j=1;j<=6;j++)
                {
                    let tempTile =gameMap.tileLists.get(`${i},${j}`);
                    tempTile.itself.interactive=true;
                }
            }
        }

    }



    /**
     * 把当前块从合成槽中移除
     */
    removeFromBar(){
        for(let i=1;i<=bar.lengthNow;i++){
            if(bar.tileLists.get(i)===this){
                for(let j=i;j<=bar.lengthNow;j++){
                    bar.tileLists.set(j,bar.tileLists.get(j+1));
                }
            }
        }
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
        this.itself = new PIXI.Sprite.from(ui.requireImg);
        this.itself.zIndex = 10;
        this.itself.position.set(systemValue.toMapX(this.positionX),systemValue.toMapY(this.positionY));
        farmArea.itself.addChild(this.itself);
        this.requiringContent = new PIXI.Sprite.from(contents[`${this.id}`]);
        this.requiringContent.position.set(0,0);
        this.requiringContent.zIndex = 15;
        this.itself.addChild(this.requiringContent);
        this.lastText = new PIXI.Text(`${this.lastingTime}`,{
            fill : 0xffffff,
        });
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
            systemValue.score+=this.earning;
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
     * 用来记录商店目前的页数
     */
    static nowPageNum = 1;
    static totalPages  = shopButton.caculateTatalPage();//记录总页数
    static caculateTatalPage() {
        if (shopButton.buttonsNumber % 5 == 0) {
            shopButton.totalPages = shopButton.buttonsNumber / 5;
        } else {
            shopButton.totalPages = shopButton.buttonsNumber / 5 + 1;
        }
        return shopButton.totalPages;
    }
    /**
     * 把当前页面所有的商店按钮显示在游戏中
     */
    static createPage(pageNum){
        for(let i = (pageNum-1)*5;i<(pageNum-1)*5+5;i++){
            let buttonNow = shopButtonList[i];
            shopButton.create(buttonNow,i);
            shopButton.checkCanBeBought(buttonNow);
        }
    }
    static create(buttonNow,i){
            buttonNow.itself = new PIXI.Sprite.from(ui.shopButtonImg);
            buttonNow.itself.zIndex = 10;
            buttonNow.itself.position.set(0, systemValue.toMapY(i % 5 === 0 ? i % 5 + 1 : i % 5 * 2 + 1));
            shopArea.itself.addChild(buttonNow.itself);
            buttonNow.titleText = new PIXI.Text(`${switchJSONToName(buttonNow.name)}\n 花费：${buttonNow.cost}，现在没钱`);
            buttonNow.titleText.position.set(0.5, 0);
            buttonNow.titleText.zIndex = 15;
            buttonNow.itself.addChild(buttonNow.titleText);
            buttonNow.itself.on('pointertap', () => {
                if (farmInformation.coinBoard.coin >= buttonNow.cost && (!buttonNow.isBought)) {
                    if (buttonNow.type === 'structure') {
                        structureSystem.createToMap(buttonNow.name);
                    }
                    farmInformation.coinBoard.change(-(buttonNow.cost));
                    buttonNow.titleText.text = `${switchJSONToName(buttonNow.name)}\n 已购买`
                    buttonNow.isBought = true;
                    shopButton.checkCanBeBoughtAll();
                }
            });
    }
    static delete(buttonNow){
        shopArea.itself.removeChild(buttonNow.itself);
        buttonNow.itself.removeChild(buttonNow.titleText);
    }
    /**
     * 创建翻页按钮
     */
    static createTurnPageButton(){
        //再商店的最下面创建两个按钮
        let prePage = new PIXI.Graphics();
        prePage.beginFill(0xFFFF00);
        prePage.zIndex =10;
        prePage.position.set(0,systemValue.size*10.5);
        prePage.drawRect(0,0,systemValue.size*3,systemValue.size);
        shopArea.itself.addChild(prePage);
        let prePageTitleText = new PIXI.Text('上一页');
        prePage.addChild(prePageTitleText);
        prePageTitleText.position.set(30,5);
        prePageTitleText.zIndex = 15;
        prePage.interactive = true;
        prePage.buttonMode = true;
        //点击事件
        prePage.on('pointertap', ()=>
        {
            console.log("点击成功");
            for(let i = (shopButton.nowPageNum-1)*5;i<(shopButton.nowPageNum-1)*5+5;i++){
                let buttonNow = shopButtonList[i];
                shopButton.delete(buttonNow);
            }
            if(shopButton.nowPageNum == 1){
                shopButton.createPage(1);
            }
            else{
                shopButton.createPage(shopButton.nowPageNum-1);
                shopButton.nowPageNum-=1;
            }
        });
        let nxtPage = new PIXI.Graphics();
        nxtPage.beginFill(0x00FF00);
        nxtPage.zIndex =10;
        nxtPage.position.set(systemValue.size*3,systemValue.size*10.5);
        nxtPage.drawRect(0,0,systemValue.size*3,systemValue.size);
        shopArea.itself.addChild(nxtPage);
        let nxtPageTitleText = new PIXI.Text('下一页');
        nxtPageTitleText.position.set(30,5);
        nxtPageTitleText.zIndex = 15;
        nxtPage.addChild(nxtPageTitleText);
        nxtPage.interactive = true;
        nxtPage.buttonMode = true;
        nxtPage.on('pointertap', ()=>
        {
            console.log("点击成功");
            for(let i = (shopButton.nowPageNum-1)*5;i<(shopButton.nowPageNum-1)*5+5;i++){
                let buttonNow = shopButtonList[i];
                shopButton.delete(buttonNow);
            }
            if(shopButton.nowPageNum == shopButton.totalPages){
                shopButton.createPage(shopButton.totalPages);
            }
            else{
                shopButton.createPage(shopButton.nowPageNum+1);
                shopButton.nowPageNum+=1;
            }
        });
    }
    /**
     * 检测是否达到了购买的条件
     */
    static checkCanBeBoughtAll(){
        for(let i=0;i<shopButton.buttonsNumber;i++){
            let buttonNow = shopButtonList[i];
            shopButton.checkCanBeBought(buttonNow);
        }
    }
    static checkCanBeBought(buttonNow){
        if(buttonNow.isBought){
            buttonNow.titleText.text= `${switchJSONToName(buttonNow.name)}\n 已购买`
            return;
        }
        if(farmInformation.coinBoard.coin<buttonNow.cost && !buttonNow.isBought){
            //buttonNow.titleText.text= `${switchJSONToName(buttonNow.name)}\n 花费：${buttonNow.cost}，现在没钱`
            buttonNow.canBeBought = false;
            return;
        }
        if(farmInformation.coinBoard.coin>=buttonNow.cost && (!buttonNow.isBought)){
            buttonNow.titleText.text= `${switchJSONToName(buttonNow.name)}\n 花费：${buttonNow.cost}，点击购买`
            buttonNow.canBeBought = true;
            buttonNow.itself.interactive = true;
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
 * @property setPointerNow function 更改最近消除的元素名称
 * @property toMapX function 把传入的x坐标变成显示器上的全局坐标
 * @property toMapY function 把传入的y坐标变成显示器上的全局坐标
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
    score: 0,
}

/**
 * 游戏舞台，放所有者东西的地方
 * @type {{positionY: number, itself: Container, create(): void, positionX: number}}
 * @property itself PIXI.Container 创建的PIXI容器
 * @property positionX number 左上角顶点横坐标
 * @property positionY number 左上角顶点纵坐标
 * @property create function 把游戏舞台创建到app上
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
 * @property create function 把牧场区域创建到游戏舞台上
 */
let farmArea ={
    itself : new PIXI.Sprite.from(ui.farmImg),
    positionX : 0,
    positionY : 0,
    endPositionX : systemValue.size *10,
    create(){
        this.itself.position.set(this.positionX, this.positionY);
        this.itself.zIndex = 5;
        gameStage.itself.addChild(this.itself);
    },
}
/**
 * 牧场信息，就是放金币和游戏时间（现在是第几年第几周的地方）
 * @type {{itself: PIXI.Graphics, gameDate: {itself: PIXI.Text, week: number, year: number, pass(): void, create(): void, startY: number, startX: number}, coinBoard: {itself: PIXI.Text, change(*): void, create(): void, startY: number, startX: number, coin: number}, endPositionY: number, endPositionX: number, create(): void, startY: number, startX: number}}
 * @property startX number 牧场信息框的左上角横坐标
 * @property startY number 牧场信息框的左上角纵坐标
 * @property itself PIXI.Graphics 信息框奔赴，是一个画的几何图形
 * @property coinBoard Object 金币信息
 * @property gameDate Object 游戏日期，一个回合为一周
 */
let farmInformation ={
    startX : farmArea.endPositionX+systemValue.size*1,
    startY : 0,
    itself : new PIXI.Sprite.from(ui.informationImg),
    endPositionX :farmArea.endPositionX+systemValue.size*7,
    endPositionY : systemValue.size*3,
    /**
     * 金币信息
     * @property startX number 左上角横坐标
     * @property startY number 左上角纵坐标
     * @property itself PIXI.Text 金币的文本
     * @property create function 创建到画面上
     * @property change function 改变所持的金币值，正数为增负数为减
     * isDoubleCoin  随机事件动物心情好，下一次需求满足奖励翻倍
     * isDestructio  随机事件动物破坏财物，扣25
     */
    coinBoard : {
        startX : 10,
        startY : 10,
        itself : new PIXI.Text(),
        coin : 50,
        isDoubleCoin: false,
        isDestruction: false,
        create(){
            this.itself.position.set(this.startX,this.startY);
            farmInformation.itself.addChild(this.itself);
            this.itself.text = `金币：${this.coin}`;
        },
        change(value){
            console.log(value);
            console.log(this.coin)
            if(this.isDoubleCoin===true){
                this.coin+=value*2;
                this.isDoubleCoin=false;
            }else {
                this.coin += value;
            }
            if(this.isDestruction===true){
                this.coin-=25;
                this.isDestruction=false;
            }

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
        this.itself.zIndex =5;
        this.itself.position.set(this.startX,this.startY);
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
    itself : new PIXI.Sprite.from(ui.mapImg),
    tileLists : new Map(),
    typeNumbers : new Map(),
    create(){
        for(let i=0;i<Tile.types.length;i++){
            gameMap.typeNumbers.set(Tile.types[i],0);
        }
        this.itself.position.set(this.startX, this.startY);
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
let bar={
    startX : gameMap.startX-systemValue.size/2,
    startY : gameMap.startY+systemValue.size*6.5,
    itself : new PIXI.Sprite.from(ui.barImg),
    maxSize : 7,
    lengthNow : 0,
    tileLists : new Map(),
    typeNumbers : new Map(),
    create(){
        for(let i=0;i<Tile.types.length;i++){
            bar.typeNumbers.set(`${Tile.types[i]}`,0);
        }
        this.itself.zIndex = 5;
        this.itself.position.set(this.startX,this.startY);
        gameStage.itself.addChild(this.itself);
    },
    toBarPosition(value){//输入数字
        return systemValue.size*(value-1);
    },
    refresh(){
        for(let i=1;i<= this.lengthNow;i++){
            this.tileLists.get(i).itself.position.set(bar.toBarPosition(i),0);
        }
    },
    checkMatch(){
        for(let i=0;i<Tile.types.length;i++){
            let tempNumber = bar.typeNumbers.get(Tile.types[i]);
            if(tempNumber>=3){
                systemValue.score +=100;
                while(tempNumber!==0){
                    for(let tile of bar.tileLists.values()){
                        if(tile.id ===Tile.types[i]){
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
    checkFull(){
        console.log(bar.tileLists)
        if(bar.lengthNow===bar.maxSize){
            farmInformation.coinBoard.change(-100);
            for(let i=7;i>2;i--){
                bar.tileLists.get(i).removeFromBar();
            }
            bar.refresh();
        }
    }
}
/**
 * 商店位置
 * @type {{itself: PIXI.Graphics, create(): void, startY: number, startX: number}}
 * @property startX number 左上角x坐标
 * @property startY number 左上角y坐标
 * @property itself PIXI.Graphics 本身，几何图形
 * @property create function 把商店背景显示出来
 */
let shopArea={
    startX : gameMap.startX + systemValue.size*7,
    startY : 0,
    itself : new PIXI.Sprite.from(ui.shopImg),
    create(){
        this.itself.zIndex =5;
        this.itself.position.set(this.startX,this.startY);
        gameStage.itself.addChild(this.itself);
    }
}
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
    let endx=(endatat-1)*48-24;//合成槽在方格的对应坐标
    let endy=312;//同上,312
    let ax=systemValue.toMapX(a.x);
    let ay=systemValue.toMapY(a.y);
    let time=setInterval(function (){
        if(ax===endx&&ay===endy){
            gameMap.itself.removeChild(a.itself);
            clearInterval(time);
            callback();
        }else {
            var walkx = (endx -ax ) / 4;
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
            a.itself.zIndex=10;
            a.itself.position.set(ax+walkx,ay+walky);
            gameMap.itself.addChild(a.itself);
            ax+=walkx;
            ay+=walky;
        }

    }, 20)
}
/**
 * 背景音乐
 */
let soundSystem={
    init(){
        PIXISound.sound.add('click',sounds.soundTapTile);
        PIXISound.sound.add('BGM1',sounds.BGM1);
        PIXISound.sound.add('BGM2',sounds.BGM2);
        PIXISound.sound.add('BGM3',sounds.BGM3);
        PIXISound.sound.add('BGM4',sounds.BGM4);
        PIXISound.sound.add('BGM5',sounds.BGM5);
        PIXISound.sound.add('BGM6',sounds.BGM6);
        PIXISound.sound.add('BGM7',sounds.BGM7);
    },
    BGM(){
        let BGMrandom=['BGM1','BGM2','BGM3','BGM4','BGM5','BGM6','BGM7'];
        let i=getRandomInt(0,6);
        PIXISound.sound.play(BGMrandom[i],soundSystem.BGM);
    },
    clickMusic(){
        PIXISound.sound.play('click');
    }
}

let RuleArea={
    itself: new PIXI.Sprite.from(ui.ruleImg),
    button: new PIXI.Text('开始吧！'),
    create(){
	this.itself.scale.x *= 1.5;
        this.itself.scale.y *= 1.5;
        this.itself.position.set(0, 0);
	this.button.scale.x *= 2;
        this.button.scale.y *= 2;
        this.button.position.set(window.innerWidth+150, 600);
        app.stage.addChild(this.itself);
        app.stage.addChild(this.button);
        this.button.interactive = true;
        this.button.on('pointertap',()=>{
            init(),
            app.stage.removeChild(this.itself);
            app.stage.removeChild(this.button);
        });
    }
}

let initArea={
    logo : {
        itself : new PIXI.Sprite.from(ui.logoImg),
	positionX : (window.innerWidth+518/4)/2,
        positionY : window.innerHeight/3,
        create(){
            this.itself.position.set(this.positionX, this.positionY);
            app.stage.addChild(this.itself);
        },
        destory(){
            app.stage.removeChild(this.itself);
        },
    },
    button : {
        itself : new PIXI.Text('开始游戏'),
	positionX : ((window.innerWidth+518/4)/2)*5/4,
        positionY : window.innerHeight*2/3,
        create(){
            this.itself.position.set(this.positionX, this.positionY);
            app.stage.addChild(this.itself);
        }
    },
    create(){
        this.logo.create();
        this.button.create();
        this.button.itself.interactive = true;
        this.button.itself.on('pointertap',()=>{
            this.logo.destory();
            RuleArea.create();
            app.stage.removeChild(this.button.itself);
        })
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

function switchJSONToName(value){
    switch (value){
        case 'cow':
            return '奶牛';
        case 'chicken':
            return '小鸡';
        case 'mayonnaiseMachine':
            return '蛋黄酱机';
        case 'loom':
            return '织布机';
        case 'rabbit':
            return '兔子';
        case 'smileEggPress':
            return '史莱姆压蛋器';
        case 'pig':
            return 'GGBond';
        case 'oilMaker':
            return '产油机';
        case 'horse':
            return '马';
        case 'beeHouse':
            return '蜂房';
        case 'bear':
            return '玩具熊';
        case 'dinosaur':
            return '恐龙';
        case 'ostrich':
            return '鸵鸟';
        case 'wolf':
            return '狼';
        case 'fox':
            return  '狐狸';
        case 'ikun':
            return  '小黑子';
        case 'kunkun':
            return '坤哥';

    }
}

/**
 * 随机事件
 * *create() 显示随机事件
 * achieve() 实现随机事件的效果
 * randomNumber  记录要显示随机事件的序号 也可以控制出现的概率
 * button 继续游戏
 * isColdWave 随机事件  寒潮  默认冻结 5 回合
 */

let randomEvent={
    button: new PIXI.Text('继续游戏'),
    isColdWave: 0,
    create() {
        this.randomNumble = getRandomInt(1, 100);//调最大值即可实现概率,1到5为出现
        if (this.randomNumble >= 0 && this.randomNumble <= 5) {
            //在随机事件图片出现时不能点击地图
            for (let i = 1; i <= 6; i++) {
                for (let j = 1; j <= 6; j++) {
                    let tempTile = gameMap.tileLists.get(`${i},${j}`);
                    tempTile.itself.interactive = false;
                }
            }
            if (this.randomNumble === 1) {
                this.itself = new PIXI.Sprite.from(random.random01);
            } else if (this.randomNumble === 2) {
                this.itself = new PIXI.Sprite.from(random.random02);
            } else if (this.randomNumble === 3) {
                this.itself = new PIXI.Sprite.from(random.random03);
            } else if (this.randomNumble === 4) {
                this.itself = new PIXI.Sprite.from(random.random04);
            } else {
                this.itself = new PIXI.Sprite.from(random.random05);
            }
            this.x = farmArea.endPositionX + systemValue.size * 6;
            this.y = gameMap.startY + systemValue.size * 1;
            this.itself.position.set(this.x, this.y);//图片位置
            this.itself.width = 520;
            this.itself.height = 430;
            this.button.position.set(this.x + this.itself.width / 2.5, this.y + this.itself.height + 20);//"继续游戏"位置
            app.stage.addChild(this.itself);
            app.stage.addChild(this.button);
            this.button.interactive = true;
            this.button.on('pointertap', () => {
                app.stage.removeChild(this.itself);
                app.stage.removeChild(this.button);
                for (let i = 1; i <= 6; i++)//恢复
                {
                    for (let j = 1; j <= 6; j++) {
                        let tempTile = gameMap.tileLists.get(`${i},${j}`);
                        tempTile.itself.interactive = true;
                    }
                }
            });
        }
    },
    achieve(){
        if(this.randomNumble>=0&&this.randomNumble<=5)
        {
            if(this.randomNumble===1){//小麦贼
                for (let i = 1; i <= 6; i++)
                {
                    for (let j = 1; j <= 6; j++) {
                        let tempTile = gameMap.tileLists.get(`${i},${j}`);
                        if(tempTile.id==='wheat')
                        {
                            gameMap.itself.removeChild(tempTile.itself);
                            gameMap.fallAndCreate(tempTile.x,tempTile.y);
                        }
                    }
                }

            }else if(this.randomNumble===2){//动物破坏了他人财物,扣25
                farmInformation.coinBoard.isDestruction=true;

            }else if(this.randomNumble===3){//寒潮  冻结 5 回合
                this.isColdWave=5;
                    for(let j=0;j<18;j++)//开始冻结,这个j控制最多冻结多少个  现在默认最多冻结一半 就是18个 因为随机数会重复
                    {
                        let x=getRandomInt(1,6);
                        let y=getRandomInt(1,6);
                        let tempTile =gameMap.tileLists.get(`${x},${y}`);
                        tempTile.itself.interactive=false;
                    }

            }else if(this.randomNumble===4){//动物心情好,下一次需求奖励的钱翻倍
                farmInformation.coinBoard.isDoubleCoin=true;
            }else {//收购商请喝茶

            }
        }
    }
}
export {createApp,};

