import { Attributes } from './core/synchronize-object/attributes';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { CompareOption, StringUtil } from './core/system/util/string-util';

@SyncObject('data')
export class DataElement extends ObjectNode {
  @SyncVar() name: string;
  @SyncVar() type: string;
  @SyncVar() currentValue: number | string;
  
  @SyncVar() step: number;
  
  // 配列だとSetterを挟めないのでSyncがうまくいかない
  @SyncVar() lineValue2: number;
  @SyncVar() lineValue3: number;
  @SyncVar() lineValue4: number;
  @SyncVar() lineValue5: number;
  @SyncVar() lineNumber: number;
  
  getLineSum() : number {
    let lineSum = 0;
    if(this.lineNumber >= 2)lineSum += this.lineValue2;
    if(this.lineNumber >= 3)lineSum += this.lineValue3;
    if(this.lineNumber >= 4)lineSum += this.lineValue4;
    if(this.lineNumber >= 5)lineSum += this.lineValue5;
    return parseInt(this.currentValue as string) + lineSum;
  }

  get isSimpleNumber(): boolean { return this.type != null && this.type === 'simpleNumber'; }
  get isNumberResource(): boolean { return this.type != null && this.type === 'numberResource'; }
  get isLineResource(): boolean { return this.type != null && this.type === 'lineResource'; }
  get isCheckProperty(): boolean { return this.type != null && this.type === 'checkProperty'; }
  get isNote(): boolean { return this.type != null && this.type === 'note'; }
  get isAbilityScore(): boolean { return this.type != null && this.type === 'abilityScore'; }
  get isUrl(): boolean { return this.type != null && this.type === 'url'; }

  oldLoggingValue: string;
  changeObserver: Function;

  public static create(name: string, value: number | string = '', attributes: Attributes = {}, identifier: string = '', lineValues?: number[]): DataElement {
    let dataElement: DataElement;
    if (identifier && 0 < identifier.length) {
      dataElement = new DataElement(identifier);
    } else {
      dataElement = new DataElement();
    }
    dataElement.attributes = attributes;
    dataElement.name = name;
    dataElement.value = value;
    dataElement.initialize();
    
    if(lineValues){
      dataElement.lineNumber = lineValues.length + 1;
      dataElement.lineValue2 = lineValues[0] ? lineValues[0] : parseInt(value as string);
      dataElement.lineValue3 = lineValues[1] ? lineValues[1] : parseInt(value as string);
      dataElement.lineValue4 = lineValues[2] ? lineValues[2] : parseInt(value as string);
      dataElement.lineValue5 = lineValues[3] ? lineValues[3] : parseInt(value as string);
    }

    return dataElement;
  }

  get loggingValue(): string {
    let ret: string;
    if (this.isSimpleNumber) {
      ret = `${this.value}`;
    } else if (this.isNumberResource) {
      ret = `${this.currentValue}/${this.value && this.value != 0 ? this.value : '???'}`;
    } else if (this.isLineResource) {
      ret = `${this.getLineSum()}/${this.value && this.value != 0 ? this.value : '???'}`;
    } else if (this.isCheckProperty) {
      ret = `${this.value ? ' → ✔ON' : ' → OFF'}`;
    } else if (this.isAbilityScore) {
      const modifire = this.calcAbilityScore();
      ret = `${this.value}`;
      if (this.currentValue) ret += `(${modifire >= 0 ? '+' : ''}${modifire})`;
    } else {
      ret = this.value == null ? '' : this.value.toString();
    }
    if (this.oldLoggingValue !== ret) {
      this.oldLoggingValue = ret;
      if (this.changeObserver) this.changeObserver();
    }
    return ret;
  }

  getElementsByName(name: string, option: CompareOption = CompareOption.None): DataElement[] {
    let children: DataElement[] = [];
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (StringUtil.equals(child.getAttribute('name'), name, option)) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByName(name, option));
      }
    }
    return children;
  }

  getElementsByType(type: string, option: CompareOption = CompareOption.None): DataElement[] {
    let children: DataElement[] = [];
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (StringUtil.equals(child.getAttribute('type'), type, option)) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByType(type, option));
      }
    }
    return children;
  }

  getFirstElementByName(name: string, option: CompareOption = CompareOption.None): DataElement {
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (StringUtil.equals(child.getAttribute('name'), name, option)) return child;
        let match = child.getFirstElementByName(name, option);
        if (match) return match;
      }
    }
    return null;
  }

  getFirstElementByNameUnsensitive(name: string, replacePattern: string|RegExp = null, replacement=''): DataElement {
    for (let child of this.children) {
      if (child instanceof DataElement) {
        let normalizeName = StringUtil.cr(StringUtil.toHalfWidth(name.replace(/[―ー—‐]/g, '-')).toLowerCase()).replace(/[\s\r\n]+/, ' ').trim();
        if (replacePattern != null) normalizeName = normalizeName.replace(replacePattern, replacement);
        if (StringUtil.cr(StringUtil.toHalfWidth(child.getAttribute('name').replace(/[―ー—‐]/g, '-')).toLowerCase()).replace(/[\s\r\n]+/, ' ').trim() === normalizeName) return child;
        let match = child.getFirstElementByNameUnsensitive(name, replacePattern, replacement);
        if (match) return match;
      }
    }
    return null;
  }

  calcAbilityScore(): number {
    if (!this.isAbilityScore || !this.value) return 0;
    let match;
    if (this.currentValue == null) {
      return +this.value;
    } else if (match = this.currentValue.toString().match(/^div(\d+)$/)) {
      return Math.floor(+this.value / +match[1]);
    // 現状3.0以降のみ
    } else if (match = this.currentValue.toString().match(/^DnD/)) {
      return Math.floor((+this.value - 10) / 2);
    } else {
      return +this.value;
    }
  }

  checkValue(): string {
    if (!this.isCheckProperty) return '0';
    let pair = (this.currentValue + '').trim().split(/[|｜]/g, 2);
    if (pair[1] == null) {
      pair[1] = '0'
      if (pair[0] == null || (pair[0].trim() === '' && !/[|｜]/.test(this.currentValue + ''))) pair[0] = '1';
    } 
    return pair[ this.value ? 0 : 1 ].trim();
  }
}
