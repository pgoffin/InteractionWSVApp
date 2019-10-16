import { LayoutInfo, SpaceAvailability } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';


interface Layout {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _wsvsWithouCurrentWSV: Array<WordScaleVisualization>;


  applyLayout(): void;
  cleanUpAfterLayout(): void;
  getRowAndColumnInfo(boundToWhat: string, aSpaceAvailability: SpaceAvailability): void;

}

export default Layout
