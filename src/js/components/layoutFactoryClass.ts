import GridLayout from './gridLayout';
import ColumnLayout from './columnLayout';
import Text from './text'

const layouts: any = {GridLayout, ColumnLayout};

export default function layoutFactoryClass(aLayoutName: string, initialLayoutInfo, refToText: Text, arrayOfWSVsWithouCurrentWSV) {

  return new layouts[aLayoutName](initialLayoutInfo, refToText, arrayOfWSVsWithouCurrentWSV)

}
