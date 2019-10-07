import GridLayout from './gridLayout';
import ColumnLayout from './columnLayout';
import ColumnPanAlignedLayout from './columnPanAlignedLayout';
import RowLayout from './rowLayout';
import GridNoOverlapLayout from './gridNoOverlapLayout';
import Text from './text'

const layouts: any = {GridLayout, ColumnLayout, ColumnPanAlignedLayout, RowLayout, GridNoOverlapLayout};

export default function layoutFactoryClass(aLayoutName: string, initialLayoutInfo, refToText: Text, arrayOfWSVsWithouCurrentWSV) {

  return new layouts[aLayoutName](initialLayoutInfo, refToText, arrayOfWSVsWithouCurrentWSV)

}
