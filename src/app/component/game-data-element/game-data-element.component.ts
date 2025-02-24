import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { EventSystem } from '@udonarium/core/system';
import { StringUtil } from '@udonarium/core/system/util/string-util';
import { DataElement } from '@udonarium/data-element';
import { GameCharacter } from '@udonarium/game-character';
import { TabletopObject } from '@udonarium/tabletop-object';
import { OpenUrlComponent } from 'component/open-url/open-url.component';
import { ModalService } from 'service/modal.service';

@Component({
  selector: 'game-data-element, [game-data-element]',
  templateUrl: './game-data-element.component.html',
  styleUrls: ['./game-data-element.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameDataElementComponent implements OnInit, OnDestroy {
  @Input() tabletopObject: TabletopObject = null;
  @Input() gameDataElement: DataElement = null;
  @Input() isEdit: boolean = false;
  @Input() isTagLocked: boolean = false;
  @Input() isValueLocked: boolean = false;
  @Input() isHideText: boolean = false;
  @Input() isNoLogging: boolean = false;
  @Input() descriptionType: string;

  stringUtil = StringUtil;

  private _name: string = '';
  get name(): string { return this._name; }
  set name(name: string) { this._name = name; this.setUpdateTimer(); }

  private _value: number | string = 0;
  get value(): number | string { return this._value; }
  set value(value: number | string) { this._value = value; this.setUpdateTimer(); }

  private _currentValue: number | string = 0;
  get currentValue(): number | string { return this._currentValue == null ? '' : this._currentValue; }
  set currentValue(currentValue: number | string) { this._currentValue = currentValue; this.setUpdateTimer(); }

  private _step: number = 1;
  get step(): number { return this._step == null ? 1 : this._step; }
  set step(step: number) { this._step = step; this.setUpdateTimer(); }

  // 配列だとSetterを挟めないのでSyncがうまくいかない
  private _lineValue2: number = 0;
  get lineValue2(): number { return this._lineValue2 == null ? parseInt(this._value as string) : this._lineValue2; }
  set lineValue2(lineValue: number) { this._lineValue2 = lineValue; this.setUpdateTimer(); }
  private _lineValue3: number = 0;
  get lineValue3(): number { return this._lineValue3 == null ? parseInt(this._value as string) : this._lineValue3; }
  set lineValue3(lineValue: number) { this._lineValue3 = lineValue; this.setUpdateTimer(); }
  private _lineValue4: number = 0;
  get lineValue4(): number { return this._lineValue4 == null ? parseInt(this._value as string) : this._lineValue4; }
  set lineValue4(lineValue: number) { this._lineValue4 = lineValue; this.setUpdateTimer(); }
  private _lineValue5: number = 0;
  get lineValue5(): number { return this._lineValue5 == null ? parseInt(this._value as string) : this._lineValue5; }
  set lineValue5(lineValue: number) { this._lineValue5 = lineValue; this.setUpdateTimer(); }
  
  private _lineNumber: number = 1;
  get lineNumber(): number { return this._lineNumber == null ? 1 : this._lineNumber; }
  set lineNumber(lineNumber: number) { this._lineNumber = lineNumber; this.setUpdateTimer(); }

  get abilityScore(): number { return this.gameDataElement.calcAbilityScore(); }

  get isTabletopObjectName() {
    return this.isTagLocked && (this.gameDataElement.name === 'name');
  }

  get tabletopObjectName() {
    let element = this.tabletopObject.commonDataElement.getFirstElementByName('name') || this.tabletopObject.commonDataElement.getFirstElementByName('title');
    return element ? <string>element.value : '';
  }

  get checkValue(): string {
    if (this.currentValue == null) return '';
    let ary = this.currentValue.toString().split(/[|｜]/, 2);
    if (ary.length <= 1) return (this.value == null || this.value == '') ? '' : this.currentValue.toString();
    let ret = (this.value == null || this.value == '') ? ary[1] : ary[0];
    if (this.tabletopObject instanceof GameCharacter && this.tabletopObject.chatPalette) {
      ret = this.tabletopObject.chatPalette.evaluate(ret, this.tabletopObject.rootDataElement);
    }
    return ret;
  }

  get isCommonValue(): boolean {
    if (this.gameDataElement) {
      return this.isTagLocked && (this.gameDataElement.name === 'size'
        || this.gameDataElement.name === 'width'
        || this.gameDataElement.name === 'height'
        || this.gameDataElement.name === 'depth'
        || this.gameDataElement.name === 'length'
        || this.gameDataElement.name === 'fontsize'
        || this.gameDataElement.name === 'opacity'
        || this.gameDataElement.name === 'altitude'
        || this.gameDataElement.name === 'color');
    }
    return false;
  }

  get isNotApplicable(): boolean {
    return this.isCommonValue && this.descriptionType === 'range-not-width' && this.gameDataElement.name === 'width';
  }

  get colorSampleTextShadowCss(): string {
    const shadow = StringUtil.textShadowColor(this.value.toString());
    return `${shadow} -1px -1px 0px, 
      ${shadow} 0px -1px 0px, 
      ${shadow} 1px -1px 0px, 
      ${shadow} -1px 0px 0px, 
      ${shadow} 1px 0px 0px,
      ${shadow} -1px 1px 0px,
      ${shadow} 0px 1px 0px,
      ${shadow} 1px 1px 0px`;
  }

  get identifier(): string {
    return this.gameDataElement.identifier;
  }

  private updateTimer: NodeJS.Timeout = null;

  myTrackBy(index: number, obj: any): any {
    return index;
  }
  
  constructor(
    private changeDetector: ChangeDetectorRef,
    private modalService: ModalService
  ) { }

  ngOnInit() {
    if (this.gameDataElement) this.setValues(this.gameDataElement);
  }

  ngOnChanges(): void {
    EventSystem.unregister(this);
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', event => {
        let isDetectChange = false;
        if (this.gameDataElement && event.data.identifier === this.gameDataElement.identifier) {
          this.setValues(this.gameDataElement);
          isDetectChange = true;
        } else if (this.tabletopObject && this.tabletopObject.contains(this.gameDataElement)) {
          isDetectChange = true;
        }
        if (isDetectChange) this.changeDetector.markForCheck();
      })
      .on(`UPDATE_GAME_OBJECT/identifier/${this.gameDataElement?.identifier}`, event => {
        this.setValues(this.gameDataElement);
        this.changeDetector.markForCheck();
      })
      .on('DELETE_GAME_OBJECT', event => {
        if (this.gameDataElement && this.gameDataElement.identifier === event.data.identifier) {
          this.changeDetector.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  addElement() {
    this.gameDataElement.appendChild(DataElement.create('タグ', '', {}));
  }

  deleteElement() {
    this.gameDataElement.destroy();
  }

  upElement() {
    let parentElement = this.gameDataElement.parent;
    let index: number = parentElement.children.indexOf(this.gameDataElement);
    if (0 < index) {
      let prevElement = parentElement.children[index - 1];
      parentElement.insertBefore(this.gameDataElement, prevElement);
    }
  }

  downElement() {
    let parentElement = this.gameDataElement.parent;
    let index: number = parentElement.children.indexOf(this.gameDataElement);
    if (index < parentElement.children.length - 1) {
      let nextElement = parentElement.children[index + 1];
      parentElement.insertBefore(nextElement, this.gameDataElement);
    }
  }

  setElementType(type: string) {
    this.gameDataElement.setAttribute('type', type);
  }

  isNum(n: any): boolean {
    return isFinite(n);
  }

  openUrl(url) {
    if (StringUtil.sameOrigin(url)) {
      window.open(url.trim(), '_blank', 'noopener');
    } else {
      this.modalService.open(OpenUrlComponent, { url: url, title: this.tabletopObjectName, subTitle: this.name });
    } 
  }

  private setValues(object: DataElement) {
    this._name = object.name;
    this._currentValue = object.currentValue;
    this._value = object.value;
    this._step = object.step;
    this._lineValue2 = object.lineValue2;
    this._lineValue3 = object.lineValue3;
    this._lineValue4 = object.lineValue4;
    this._lineValue5 = object.lineValue5;
    this._lineNumber = object.lineNumber;
  }

  private setUpdateTimer() {
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      if (this.gameDataElement.name !== this.name) this.gameDataElement.name = this.name;
      if (this.gameDataElement.currentValue !== this.currentValue) this.gameDataElement.currentValue = this.currentValue;
      if (this.gameDataElement.value !== this.value) this.gameDataElement.value = this.value;
      if (this.gameDataElement.step !== this.step) this.gameDataElement.step = this.step;
      if (this.gameDataElement.lineValue2 !== this.lineValue2) this.gameDataElement.lineValue2 = this.lineValue2;
      if (this.gameDataElement.lineValue3 !== this.lineValue3) this.gameDataElement.lineValue3 = this.lineValue3;
      if (this.gameDataElement.lineValue4 !== this.lineValue4) this.gameDataElement.lineValue4 = this.lineValue4;
      if (this.gameDataElement.lineValue5 !== this.lineValue5) this.gameDataElement.lineValue5 = this.lineValue5;
      if (this.gameDataElement.lineNumber !== this.lineNumber) this.gameDataElement.lineNumber = this.lineNumber;
      this.updateTimer = null;
    }, 66);
  }
}
