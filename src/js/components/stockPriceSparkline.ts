import { RenderFunc, WsVisualizationType, RawWsvData } from "../../../global";

import { wsvInteractionConstants } from '../constants';



class StockPriceSparkline implements WsVisualizationType {
  _renderer: RenderFunc;

  _settings: object = {};

  _rawWsvData: Array<RawWsvData> = [];
  _transformedWsvData: Array<object> = [];

  _numberOfMarks: number;
  _markWidth: number;

  _width: number;
  _height: number;


  constructor(aRenderer: RenderFunc, aRawData: Array<RawWsvData>, aPosition: string, aPaddingWidth: Boolean, aPaddingHeight: Boolean) {
    this.renderer = aRenderer;
    this.rawWsvData = aRawData;

    this.transformedWsvData = this.transformRawData(this.rawWsvData)

    this._numberOfMarks = wsvInteractionConstants.numberOfMarks;
    this._markWidth = wsvInteractionConstants.stockLineChartSize.markWidth;

    this._width = (this._markWidth * this._numberOfMarks);
    this._height = wsvInteractionConstants.stockLineChartSize.heightWordScaleVis;

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
  set renderer(value: RenderFunc) {
      this._renderer = value;
  }
  get renderer(): RenderFunc {
      return this._renderer;
  }

  set rawWsvData(value: Array<RawWsvData>) {
      this._rawWsvData = value;
  }
  get rawWsvData(): Array<RawWsvData> {
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


  transformRawData(aRawData: Array<RawWsvData>): Array<RawWsvData> {

    // sort the stockData array
    let transformedStockData = aRawData.map((element: RawWsvData) => {
      return {close: element.changeToFirst, date: new Date(element.date)};
    });

    transformedStockData.sort((a: RawWsvData, b: RawWsvData) => {
      return a.date - b.date;
    });

    // sorted data, ascending
    return [{id: 0, values: transformedStockData}];
  }

}

export default StockPriceSparkline;
