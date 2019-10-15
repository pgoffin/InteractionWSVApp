import { WsvDataObject, RawWsvData, RenderFunc, WsVisualizationType, BBox } from "../../../global";
import Entity from './entity';
import wsvRendererFactoryClass from './wsvRendererFactoryClass';
import Text from './text';

import { wsvInteractionConstants } from '../constants';

// to run sparklificator
require('webpack-jquery-ui/widgets');
const renderers = require('../../lib/renderers');
require('../../lib/jquery.sparklificator');


interface WordScaleVisualization {
  _entity: Entity;
  _rawWSVData: Array<RawWsvData>;
  _typeOfWSV: string;
  _renderer: RenderFunc;
}



class WordScaleVisualization implements WordScaleVisualization {

  _entity: Entity;
  _rawWSVData: Array<RawWsvData> ;

  _typeOfWSV: string;
  _positionOfWSV: string;

  _renderer: RenderFunc;

  _transformedData: WsvDataObject;

  _rendererAsClass: string;
  _rendererString: string;

  _visualization: HTMLElement;
  _wsvVisualizationBBox: BBox;

  _wsv: HTMLElement;
  _wsvBBox: BBox;

  _wsvClass: WsVisualizationType;

  _refToText: Text;

  _aboveOrBelow: string;
  _middleBoundOffset: number;
  _offset_whiteLayer: number;
  _distanceToCurrEntity: number;

  _backgroundElement: HTMLElement;
  _theClonedWSV: WordScaleVisualization;
  _theOriginalWSV: WordScaleVisualization;



  constructor(anElement: HTMLElement, data: Array<RawWsvData>, theRenderer: string, referenceToText: Text, aIsAClone: Boolean) {
    this._refToText = referenceToText;
    this._positionOfWSV = wsvInteractionConstants.positionType;
    this.entity = new Entity(anElement, this._refToText, this, aIsAClone);

    this.rawWSVData = data;

    this.renderer = renderers[theRenderer];
    this._rendererString = theRenderer;
    this._rendererAsClass = theRenderer.charAt(0).toUpperCase() + theRenderer.slice(1);

    this.wsvClass = wsvRendererFactoryClass(this._rendererAsClass, this.renderer, this.rawWSVData, this._positionOfWSV, true, true)

    $(this.entity.entityElement).sparklificator();
    $(this.entity.entityElement).sparklificator('option', this.wsvClass._settings);

    this._wsv = this.entity.entityElement.parentElement;

    this._visualization = this._wsv.querySelector('span.sparkline');

    this.typeOfWSV = wsvInteractionConstants.typeOfWSV;

    // bboxes
    this.getBBoxOfSparkline();
    this.getBBoxOfWSV();

  }


  // getter/setter
  set entity(value: Entity) {
      this._entity = value;
  }
  get entity(): Entity {
      return this._entity;
  }

  set rawWSVData(value: Array<RawWsvData>) {
      this._rawWSVData = value;
  }
  get rawWSVData(): Array<RawWsvData> {
      return this._rawWSVData;
  }

  // set hasData(value: Boolean) {
  //     this._hasData = value;
  // }
  // get hasData(): Boolean {
  //     return this._hasData;
  // }

  set typeOfWSV(value: string) {
      this._typeOfWSV = value;
  }
  get typeOfWSV(): string {
      return this._typeOfWSV;
  }

  set renderer(value: RenderFunc) {
      this._renderer = value;
  }
  get renderer(): RenderFunc {
      return this._renderer;
  }

  set wsvClass(value: WsVisualizationType) {
      this._wsvClass = value;
  }
  get wsvClass(): WsVisualizationType {
      return this._wsvClass;
  }


  getBBoxOfWSV() {
    let theBbox = {left: 0,
                   top: 0,
                   right: 0,
                   bottom: 0,
                   width: 0,
                   height: 0};

    // adapt top and bottom to give values according to the document
    let bboxWSV = this._wsv.getBoundingClientRect();

    let scrollingOffset = document.body.scrollTop;
    // let scrollingOffset = $(window).scrollTop();

    // let bboxEntity = this.get_BBox_entity(theWSV);
    // let bboxSparkline = this.get_BBox_sparkline(theWSV);
    let bboxEntity = this.entity._entityBbox;

    this.getBBoxOfSparkline();
    let bboxSparkline = this._wsvVisualizationBBox

    if (this._positionOfWSV === 'right') {
      // theBbox.left = bboxEntity.left;
      theBbox.left = bboxWSV.left;
      theBbox.top = bboxWSV.top + scrollingOffset;
      // theBbox.right = bboxSparkline.right;
      theBbox.right =  bboxSparkline.right;
      theBbox.bottom = bboxWSV.bottom + scrollingOffset;
      // theBbox.width = bboxSparkline.right - bboxEntity.left;
      theBbox.width = bboxSparkline.right - bboxEntity.left;
      theBbox.height = bboxWSV.height;

    } else {
      console.log('position type not implemented');
    }

    this._wsvBBox = theBbox
    // return theBbox;
  }


  getBBoxOfSparkline() {
    let theBbox = { left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 0,
                    height: 0};

    // adapt top and bottom to give values according to the document
    let bbox = this._visualization.getBoundingClientRect();

    let scrollingOffset = document.body.scrollTop;

    theBbox.left = bbox.left;
    theBbox.top = bbox.top + scrollingOffset;
    theBbox.right = bbox.right;
    theBbox.bottom = bbox.bottom + scrollingOffset;
    theBbox.width = bbox.width;
    theBbox.height = bbox.height;

    this._wsvVisualizationBBox = theBbox;

    // return theBbox;
  }


  cloneWSV(): WordScaleVisualization {

    let cloneEntityElement = this.entity.entityElement.cloneNode(true)
    let insertedClonedEntityNode = this._wsv.parentNode.insertBefore(cloneEntityElement, this._wsv.nextSibling)

    let clonedWSV = new WordScaleVisualization(insertedClonedEntityNode as HTMLElement, this._rawWSVData, this._rendererString, this._refToText, true);

    clonedWSV.entity.entityElement.classList.add('cloned');
    clonedWSV._wsv.classList.add('cloned');
    clonedWSV._visualization.classList.add('cloned');

    // clonedWSV._wsv.setStyle('z-index', '6');
    // clonedWSV._wsv.style.zIndex = '6';

    return clonedWSV;
  }

}

export default WordScaleVisualization
