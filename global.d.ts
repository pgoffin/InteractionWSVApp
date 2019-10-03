export interface wsvDataObject {
  [key: string]: Array<rawWsvData>;
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


export interface rawWsvData {
   [key: string]: string|number|Date;
}

export interface LayoutType {

}

export interface BBox {
  left: number,
  top: number,
  right: number,
  bottom: number,
  width: number,
  height: number
}
