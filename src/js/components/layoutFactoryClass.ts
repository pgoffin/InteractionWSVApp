import GridLayout from './gridLayout'
import Text from './text'

const layouts: any = {GridLayout};

export default function layoutFactoryClass(aLayoutName: string, initialLayoutInfo, refToText: Text, arrayOfWSVsWithouCurrentWSV) {

  return new layouts[aLayoutName](initialLayoutInfo, refToText, arrayOfWSVsWithouCurrentWSV)

}
