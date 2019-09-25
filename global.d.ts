export interface wsvDataObject {
  [key: string]: Array<object>;
}

export interface renderFunc {
  (sparkSpan: string, width: number, height: number, interaction: Boolean, environment: string, data:Array<object>): void
}

export interface WsVisualizationType {
  _renderer: renderFunc;

  _settings: object;

  _rawWsvData: object;
  _transformedWsvData: object;

  _numberOfMarks?: number;
  _markWidth?: number;

  _width: number;
  _height: number;
}

export interface rawStockPriceSparklineData {
   [key: string]: string|number;
}
