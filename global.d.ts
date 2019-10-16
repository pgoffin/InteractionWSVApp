import Entity from "./src/js/components/entity";

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

export interface ColsAndRowsNumber {
  leftNumbColumn: number,
  rightNumbColumn: number,
  currentEntityColumn: number,
  // totalNumberOfColumns: number,
  aboveNumbRow: number,
  belowNumbRow: number
}

export interface LayoutInfo {
  type: string,
  cellDimensions: CellDimension,
  currentEntity: Entity,
  spaceBetweenCells: number,
  rowAndColumnNumbers: ColsAndRowsNumber,
  numberOfColumns: number,

  topLeftCorner_left?: number,
  topLeftCorner_top?: number,
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

export interface CellDimension {
  height: number,
  width: number
}
