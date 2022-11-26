import * as PIXI from 'pixi.js';
import * as contents from './contents';
import * as structures from './structures'
import {structureList} from './structureList';
import {shopButtonList} from './shopButtonList';
import * as ui from './ui';
import {systemValue} from "@/scripts/systems/systemValue";
import {initArea} from "@/scripts/gameObjects/initArea";
import {soundSystem} from "@/scripts/systems/soundSystem";
import {farmArea} from "@/scripts/gameObjects/farmArea";
import {farmInformation} from "@/scripts/gameObjects/farmInformation";
import {gameMap} from "@/scripts/gameObjects/gameMap";
import {shopArea} from "@/scripts/gameObjects/shopArea";
import {bar} from "@/scripts/gameObjects/bar";
import {getMove} from "@/scripts/systems/getMove";

/**
 * 整个PIXI应用，所有的元素都应是这个应用的子元素
 * @type {PIXI.Application}
 */
const app = new PIXI.Application({
    backgroundColor : 0x90EE90,
});

// 版本号
let versionNumber='alpha 1.2.1\npowered by 6lszxz, Xingxinyuxxy, qxr001, lzj26 and lwnzzz';

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
    //shopButton.createTurnPageButton();
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
        itemRequire.checkSuccesses();
        itemRequire.lastingTimeChanges(1);
        itemRequire.checkFails();
        shopButton.checkCanBeBoughtAll();
        farmInformation.gameDate.pass();
        itemRequire.spawnRandomRequire();
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
        }
    }
    static create(buttonNow,i){
        buttonNow.isBought = false;
        buttonNow.canBeBought = false;
        buttonNow.itself = new PIXI.Sprite.from(ui.shopButtonImg);
        buttonNow.itself.zIndex =10;
        buttonNow.itself.position.set(0,systemValue.toMapY(i%5===0?i%5+1:i%5*2+1));
        shopArea.itself.addChild(buttonNow.itself);
        buttonNow.titleText = new PIXI.Text(`${buttonNow.name}\n 花费：${buttonNow.cost}，现在没钱`);
        buttonNow.titleText.position.set(10,0);
        buttonNow.titleText.zIndex =15;
        buttonNow.itself.addChild(buttonNow.titleText);
        buttonNow.itself.on('pointertap',()=>{
            if(farmInformation.coinBoard.coin>=buttonNow.cost && (!buttonNow.isBought)){
                if(buttonNow.type === 'structure'){
                    structureSystem.createToMap(buttonNow.name);
                }
                farmInformation.coinBoard.change(-(buttonNow.cost));
                buttonNow.titleText.text= `${buttonNow.name}\n 已购买`
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
        let prePage = new PIXI.Sprite.from(ui.shopButtonImg);
        prePage.zIndex =10;
        prePage.position.set(0,systemValue.size*11);
        prePage.drawRect(0,0,systemValue.size*3,systemValue.size);
        shopArea.itself.addChild(prePage);
        let prePageTitleText = new PIXI.Text('上一页');
        prePage.addChild(prePageTitleText);
        prePageTitleText.position.set(15,0);
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
        let nxtPage = new PIXI.Sprite.from(ui.shopButtonImg);
        nxtPage.zIndex =10;
        nxtPage.position.set(systemValue.size*3,systemValue.size*11);
        nxtPage.drawRect(0,0,systemValue.size*3,systemValue.size);
        shopArea.itself.addChild(nxtPage);
        let nxtPageTitleText = new PIXI.Text('下一页');
        nxtPageTitleText.position.set(15,0);
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
            buttonNow.titleText.text= `${buttonNow.name}\n 已购买`
            return;
        }
        if(farmInformation.coinBoard.coin<buttonNow.cost && !buttonNow.isBought){
            buttonNow.titleText.text= `${buttonNow.name}\n 花费：${buttonNow.cost}，现在没钱`
            buttonNow.canBeBought = false;
            return;
        }
        if(farmInformation.coinBoard.coin>=buttonNow.cost && (!buttonNow.isBought)){
            buttonNow.titleText.text= `${buttonNow.name}\n 花费：${buttonNow.cost}，点击购买`
            buttonNow.canBeBought = true;
            buttonNow.itself.interactive = true;
        }
    }
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

export {
    createApp,app,itemRequire,Tile,tapLoop, gameStage, shopButton, structureSystem,
    versionNumber,init,
};

