import { ChatPalette } from './chat-palette';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { DataElement } from './data-element';
import { TabletopObject } from './tabletop-object';
import { UUID } from '@udonarium/core/system/util/uuid';

import { StandList } from './stand-list';
import { Network } from './core/system';
import { PeerCursor } from './peer-cursor';
import { ObjectStore } from './core/synchronize-object/object-store';

@SyncObject('character')
export class GameCharacter extends TabletopObject {
  constructor(identifier: string = UUID.generateUuid()) {
    super(identifier);
    this.isAltitudeIndicate = true;
  }

  @SyncVar() rotate: number = 0;
  @SyncVar() roll: number = 0;
  @SyncVar() isDropShadow: boolean = true;
  @SyncVar() isShowChatBubble: boolean = true;
  @SyncVar() owner: string = '';
  
  text = '';
  dialog = null;
  isEmote = false;
  isLoaded = false;

  //汚い、別の方法ないか
  chatBubbleAltitude = 0;

  get name(): string { return this.getCommonValue('name', ''); }
  set name(name) { this.setCommonValue('name', name); }
  get size(): number { return this.getCommonValue('size', 1); }
  get height(): number {
    let element = this.getElement('height', this.commonDataElement);
    //if (!element && this.commonDataElement) {
    //  this.commonDataElement.insertBefore(DataElement.create('height', 0, { 'currentValue': '' }, 'height_' + this.identifier), this.getElement('altitude', this.commonDataElement));
    //}
    let num = element ? +element.value : 0;
    if (element && element.currentValue) num = (Number.isNaN(num) ? 0 : num) * this.size;
    return Number.isNaN(num) ? 0 : num;
  }

  get chatPalette(): ChatPalette {
    for (let child of this.children) {
      if (child instanceof ChatPalette) return child;
    }
    return null;
  }

  get ownerName(): string {
    let object = PeerCursor.findByUserId(this.owner);
    return object ? object.name : null;
  }

  get ownerColor(): string {
    let object = PeerCursor.findByUserId(this.owner);
    return object ? object.color : '#444444';
  }
  
  get standList(): StandList {
    for (let child of this.children) {
      if (child instanceof StandList) return child;
    }
    let standList = new StandList('StandList_' + this.identifier);
    standList.initialize();
    this.appendChild(standList);
    return standList;
  }

  static create(name: string, size: number, imageIdentifier: string): GameCharacter {
    let gameCharacter: GameCharacter = new GameCharacter();
    gameCharacter.createDataElements();
    gameCharacter.initialize();
    gameCharacter.createTestGameDataElement(name, size, imageIdentifier);

    return gameCharacter;
  }

  get isHideIn(): boolean { return !!this.owner; }
  get isVisible(): boolean { return !this.owner || Network.peer.userId === this.owner; }

  static get isStealthMode(): boolean {
    for (const character of ObjectStore.instance.getObjects(GameCharacter)) {
      if (character.isHideIn && character.isVisible && character.location.name === 'table') return true;
    }
    return false;
  }

  complement(): void {
    let element = this.getElement('altitude', this.commonDataElement);
    if (!element && this.commonDataElement) {
      this.commonDataElement.appendChild(DataElement.create('altitude', 0, {}, 'altitude_' + this.identifier));
    }
    element = this.getElement('height', this.commonDataElement);
    if (!element && this.commonDataElement) {
      this.commonDataElement.insertBefore(DataElement.create('height', 0, { 'currentValue': '' }, 'height_' + this.identifier), this.getElement('altitude', this.commonDataElement));
    }
  }

  createTestGameDataElement(name: string, size: number, imageIdentifier: string) {
    this.createDataElements();

    let nameElement: DataElement = DataElement.create('name', name, {}, 'name_' + this.identifier);
    let sizeElement: DataElement = DataElement.create('size', size, {}, 'size_' + this.identifier);
    let heightElement: DataElement = DataElement.create('height', 0, { 'currentValue': '' }, 'height_' + this.identifier);
    let altitudeElement: DataElement = DataElement.create('altitude', 0, {}, 'altitude_' + this.identifier);

    if (this.imageDataElement.getFirstElementByName('imageIdentifier')) {
      this.imageDataElement.getFirstElementByName('imageIdentifier').value = imageIdentifier;
    }

    this.commonDataElement.appendChild(nameElement);
    this.commonDataElement.appendChild(sizeElement);
    this.commonDataElement.appendChild(heightElement);
    this.commonDataElement.appendChild(altitudeElement);
    
    let apElement: DataElement = DataElement.create('AP', '', {}, 'AP' + this.identifier);
    apElement.appendChild(DataElement.create('コア', 50, { 'type': 'lineResource', 'currentValue': '50', 'step': '10', 'lineNumber':'3' }, 'コアAP_' + this.identifier, [50,50]));
    apElement.appendChild(DataElement.create('右腕', 50, { 'type': 'lineResource', 'currentValue': '50', 'step': '10', 'lineNumber':'2' }, '右腕AP_' + this.identifier, [50]));
    apElement.appendChild(DataElement.create('左腕', 50, { 'type': 'lineResource', 'currentValue': '50', 'step': '10', 'lineNumber':'2' }, '左腕AP_' + this.identifier, [50]));
    apElement.appendChild(DataElement.create('脚部', 40, { 'type': 'lineResource', 'currentValue': '40', 'step': '10', 'lineNumber':'3' }, '脚部AP_' + this.identifier, [40,40]));
    this.detailDataElement.appendChild(apElement);
    
    let bulletElement: DataElement = DataElement.create('弾数', '', {}, '弾数' + this.identifier);
    bulletElement.appendChild(DataElement.create('RA', 6, { 'type': 'lineResource', 'currentValue': '6', 'step': '1', 'lineNumber':'2' }, 'RA_' + this.identifier, [6]));
    bulletElement.appendChild(DataElement.create('LA', 1, { 'type': 'lineResource', 'currentValue': '0', 'step': '1', 'lineNumber':'1' }, 'LA_' + this.identifier));
    bulletElement.appendChild(DataElement.create('RB', 4, { 'type': 'lineResource', 'currentValue': '4', 'step': '1', 'lineNumber':'4' }, 'RB_' + this.identifier, [4,4,4]));
    bulletElement.appendChild(DataElement.create('LB', 4, { 'type': 'lineResource', 'currentValue': '4', 'step': '1', 'lineNumber':'2' }, 'LB_' + this.identifier, [4]));
    this.detailDataElement.appendChild(bulletElement);

    //TEST
    let testElement: DataElement = DataElement.create('情報', '', {}, '情報' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('説明', 'ここに説明を書く\nあいうえお', { 'type': 'note' }, '説明' + this.identifier));
    testElement.appendChild(DataElement.create('メモ', '任意の文字列\n１\n２\n３\n４\n５', { 'type': 'note' }, 'メモ' + this.identifier));
    testElement.appendChild(DataElement.create('参照URL', 'https://www.example.com', { 'type': 'url' }, '参照URL' + this.identifier));

    //TEST
    testElement = DataElement.create('能力', '', {}, '能力' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('器用度', 24, { 'type': 'abilityScore', 'currentValue': 'div6' }, '器用度' + this.identifier));
    testElement.appendChild(DataElement.create('敏捷度', 24, { 'type': 'abilityScore', 'currentValue': 'div6' }, '敏捷度' + this.identifier));
    testElement.appendChild(DataElement.create('筋力', 24, { 'type': 'abilityScore', 'currentValue': 'div6' }, '筋力' + this.identifier));
    testElement.appendChild(DataElement.create('生命力', 24, { 'type': 'abilityScore', 'currentValue': 'div6' }, '生命力' + this.identifier));
    testElement.appendChild(DataElement.create('知力', 24, { 'type': 'abilityScore', 'currentValue': 'div6' }, '知力' + this.identifier));
    testElement.appendChild(DataElement.create('精神力', 24, { 'type': 'abilityScore', 'currentValue': 'div6' }, '精神力' + this.identifier));

    //TEST
    testElement = DataElement.create('戦闘特技', '', {}, '戦闘特技' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('Lv1', '全力攻撃', {}, 'Lv1' + this.identifier));
    testElement.appendChild(DataElement.create('Lv3', '武器習熟/ソード', {}, 'Lv3' + this.identifier));
    testElement.appendChild(DataElement.create('Lv5', '武器習熟/ソードⅡ', {}, 'Lv5' + this.identifier));
    testElement.appendChild(DataElement.create('Lv7', '頑強', {}, 'Lv7' + this.identifier));
    testElement.appendChild(DataElement.create('Lv9', '薙ぎ払い', {}, 'Lv9' + this.identifier));
    testElement.appendChild(DataElement.create('自動', '治癒適正', {}, '自動' + this.identifier));

    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(this.rootDataElement.toXml(), 'application/xml');

    let palette: ChatPalette = new ChatPalette('ChatPalette_' + this.identifier);
    palette.setPalette(`チャットパレット入力例：
2d6+1 ダイスロール
１ｄ２０＋{敏捷}＋｛格闘｝　{name}の格闘！
:コア-70
:コア-20W
:コア-90B
:HP={最大HP}:MP-10 HP全回復！ MP{$2}、HP{HP} → {$HP}（{$1}点回復）
//敏捷=10+{敏捷A}
//敏捷A=10
//格闘＝１`);
    palette.initialize();
    this.appendChild(palette);

    let standList = new StandList('StandList_' + this.identifier);
    standList.initialize();
    this.appendChild(standList);
  }
}
