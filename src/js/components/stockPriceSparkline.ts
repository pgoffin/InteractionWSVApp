import { renderFunc, WsVisualizationType, rawWsvData } from "../../../global";

const constants = require('../constants');




class StockPriceSparkline implements WsVisualizationType {
  _renderer: renderFunc;

  _settings: object = {};

  _rawWsvData: Array<rawWsvData> = [];
  _transformedWsvData: Array<object> = [];

  _numberOfMarks: number;
  _markWidth: number;

  _width: number;
  _height: number;


  constructor(aRenderer: renderFunc, aRawData: Array<rawWsvData>, aPosition: string, aPaddingWidth: Boolean, aPaddingHeight: Boolean) {
    this.renderer = aRenderer;
    this.rawWsvData = aRawData;

    this.transformedWsvData = this.transformRawData(this.rawWsvData)

    this._numberOfMarks = constants.numberOfMarks;
    this._markWidth = constants.stockLineChartSize.markWidth;

    this._width = (this._markWidth * this._numberOfMarks);
    this._height = constants.stockLineChartSize.heightWordScaleVis;

    let aSettings = {data: this.transformedWsvData,
                     renderer: this.renderer,
                     position: aPosition,
                     paddingWidth: aPaddingWidth,
                     paddingHeight: aPaddingHeight,
                     width: this._width,
                     height: this._height}
    this.settings = aSettings
  }


  // getter/setter
  set renderer(value: renderFunc) {
      this._renderer = value;
  }
  get renderer(): renderFunc {
      return this._renderer;
  }

  set rawWsvData(value: Array<rawWsvData>) {
      this._rawWsvData = value;
  }
  get rawWsvData(): Array<rawWsvData> {
      return this._rawWsvData;
  }

  set transformedWsvData(value: any) {
      this._transformedWsvData = value;
  }
  get transformedWsvData(): any {
      return this._transformedWsvData;
  }

  set settings(aSettings: object) {
      this._settings = aSettings;
  }
  get settings(): object {
      return this._settings;
  }


  transformRawData(aRawData: Array<rawWsvData>): Array<rawWsvData> {

    // sort the stockData array
    let transformedStockData = aRawData.map((element: rawWsvData) => {
      return {close: element.changeToFirst, date: new Date(element.date)};
    });

    transformedStockData.sort((a: rawWsvData, b: rawWsvData) => {
      return a.date - b.date;
    });

    // sorted data, ascending
    return [{id: 0, values: transformedStockData}];
  }

}

export default StockPriceSparkline;
