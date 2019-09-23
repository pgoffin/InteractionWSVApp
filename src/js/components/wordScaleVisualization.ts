import { wsvDataObject } from "../../../global";
import Entity from './entity';

const constants = require('../constants');


interface WordScaleVisualization {
  _entity: Entity;

  // _wordScaleVis: ;

  _wsvData: wsvDataObject;
}



class WordScaleVisualization implements WordScaleVisualization {

  _entity: Entity = null;

  _wsvData: wsvDataObject = null;
  _hasData: Boolean = false;

  _typeOfWSV: string = '';

  _wordScaleVis;

  constructor(anElement: HTMLElement, data: wsvDataObject) {
    this.entity = new Entity(anElement);

    this.wsvData = data[this.entity.entityName.trim()];

    if (!((typeof this.wsvData == 'undefined') || (Object.getOwnPropertyNames(this.wsvData).length === 0))) {
      this.hasData = true;
    }

    this.typeOfWSV = constants.typeOfWSV;

    if (this.hasData) {
      this.wordScaleVis = 
    }
  }

  // getter/setter
  set entity(value: Entity) {
      this._entity = value;
  }
  get entity(): Entity {
      return this._entity;
  }

  set wsvData(value: wsvDataObject) {
      this._wsvData = value;
  }
  get wsvData(): wsvDataObject {
      return this._wsvData;
  }

  set hasData(value: Boolean) {
      this._hasData = value;
  }
  get hasData(): Boolean {
      return this._hasData;
  }

  set typeOfWSV(value: string) {
      this._typeOfWSV = value;
  }
  get typeOfWSV(): string {
      return this._typeOfWSV;
  }

  set wordScaleVis(value: any) {
      this._wordScaleVis = value;
  }
  get wordScaleVis(): any {
      return this._wordScaleVis;
  }
}

export default WordScaleVisualization;
