export interface WsvDataObject {
  [key: string]: Array<RawWsvData>;
}


export interface RenderFunc {
  (sparkSpan: string, width: number, height: number, interaction: Boolean, environment: string, data:Array<object>): void
}


export interface WsVisualizationType {
  _renderer: RenderFunc;

  _settings: object;

  _rawWsvData: object;
  _transformedWsvData: object;

  _numberOfMarks?: number;
  _markWidth?: number;

  _width: number;
  _height: number;
}


export interface RawWsvData {
 [key: string]: string|number|Date;
}

export interface NumberColAndRows {
  leftNumbColumn: number,
  rightNumbColumn: number,
  currentEntityColumn: number,
  totalNumberOfColumns: number,
  aboveNumbRow: number,
  belowNumbRow: number
}

export interface LayoutInfo {
  type?: string,
  topLeftCorner_left?: number,
  topLeftCorner_top?: number,
  numberOfColumns?: number,
  cell_dimensions?: {width: number, height: number},
  spaceBetweenGridCells?: number,
  viewportLeft?: number,
  viewportRight?: number,
  viewportTop?: number,
  viewportBottom?: number,
  rowAndColumnNumbers: NumberColAndRows,
  counts?,
  startIndex_above?: number,
  startIndex_below?: number,
  bandLength?: number,
  startOffsetRowlayout?: number,
  snapPositions?
}


export interface BBox {
  left: number,
  top: number,
  right: number,
  bottom: number,
  width: number,
  height: number
}

export interface EventLocation {
  x: number,
  y: number
}

export interface VelocitySequence {
  e: HTMLElement,
  p: {left: number, top: number, opacity?: number},
  o: {duration: number, sequenceQueue: Boolean, complete?: (() => void) | ((arg0: [HTMLElement]) => void)}
}
