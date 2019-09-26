import { wsvDataObject, rawStockPriceSparklineData, renderFunc, WsVisualizationType } from "../../../global";
import Entity from './entity';
import wsvFactoryClass from './wsvFactoryClass';
import Text from './text';

const constants = require('../constants');

// to run sparklificator
require('webpack-jquery-ui/widgets');
const renderers = require('../../lib/renderers');
require('../../lib/jquery.sparklificator');


interface WordScaleVisualization {
  _entity: Entity;

  // _wordScaleVis: ;
  _typeOfWSV: string;
  _renderer: renderFunc;

  _rawWSVData: Array<rawStockPriceSparklineData>;
}



class WordScaleVisualization implements WordScaleVisualization {

  _entity: Entity = null;

  _rawWSVData: Array<rawStockPriceSparklineData> = [];
  _hasData: Boolean = false;

  _typeOfWSV: string = '';

  _renderer: renderFunc;

  _transformedData: wsvDataObject = null;

  _rendereAsClass: string = '';

  _visualization: HTMLElement = null;

  _wsv: HTMLElement = null;

  _wsvClass: WsVisualizationType;

  _refToText: Text;



  constructor(anElement: HTMLElement, data: wsvDataObject, theRenderer: string, referenceToText: Text) {
    this._refToText = referenceToText;
    this.entity = new Entity(anElement, this._refToText);

    this.rawWSVData = data[this.entity.entityName.trim()];

    this.renderer = renderers[theRenderer];
    this._rendereAsClass = theRenderer.charAt(0).toUpperCase() + theRenderer.slice(1);

    // create the visualization part of the wsv if there is data available
    if (!((typeof this.rawWSVData == 'undefined') || (this.rawWSVData.length == 0))) {
      this.hasData = true;

      this.wsvClass = wsvFactoryClass(this._rendereAsClass, this.renderer, this.rawWSVData, constants.positionType, true, true)

      $(this.entity.entityElement).sparklificator();
      $(this.entity.entityElement).sparklificator('option', this.wsvClass.settings);
    } else {
      this.entity.entityElement.classList.toggle('noClass')
    }

    this.typeOfWSV = constants.typeOfWSV;

  }


  // getter/setter
  set entity(value: Entity) {
      this._entity = value;
  }
  get entity(): Entity {
      return this._entity;
  }

  set rawWSVData(value: Array<rawStockPriceSparklineData>) {
      this._rawWSVData = value;
  }
  get rawWSVData(): Array<rawStockPriceSparklineData> {
      return this._rawWSVData;
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

  set renderer(value: renderFunc) {
      this._renderer = value;
  }
  get renderer(): renderFunc {
      return this._renderer;
  }

  set wsvClass(value: WsVisualizationType) {
      this._wsvClass = value;
  }
  get wsvClass(): WsVisualizationType {
      return this._wsvClass;
  }


  // applySparklificator() {
  //
  //   let settings = {data: dataObject,
  //                   renderer: renderers[this.renderer],
  //                   position: constants.positionType,
  //                   paddingWidth: true,
  //                   paddingHeight: true,
  //                   width: (constants.stockLineChartSize.markWidth * constants.numberOfMarks),
  //                   height: constants.stockLineChartSize.heightWordScaleVis};
  //
  //   $(this.entity.entityElement).sparklificator();
  //   $(this.entity.entityElement).sparklificator('option', settings);
  // }


}

export default WordScaleVisualization;
