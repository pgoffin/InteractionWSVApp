import { LayoutInfo } from "../../../global";

import GridLayout from './gridLayout';
import ColumnLayout from './columnLayout';
import ColumnPanAlignedLayout from './columnPanAlignedLayout';
import RowLayout from './rowLayout';
import GridNoOverlapLayout from './gridNoOverlapLayout';
import Text from './text'
import WordScaleVisualization from './wordScaleVisualization';



const layouts: any = {GridLayout, ColumnLayout, ColumnPanAlignedLayout, RowLayout, GridNoOverlapLayout};


export default function layoutFactoryClass(aLayoutName: string, initialLayoutInfo: LayoutInfo, refToText: Text, arrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>) {

  return new layouts[aLayoutName](initialLayoutInfo, refToText, arrayOfWSVsWithouCurrentWSV)

}
