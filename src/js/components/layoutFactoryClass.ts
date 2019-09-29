// import { renderFunc } from "../../../global";

import GridLayout from './gridLayout'

const layouts: any = {GridLayout};

export default function layoutFactoryClass(aLayoutName: string, initialLayoutInfo) {

  return new layouts[aLayoutName](initialLayoutInfo)

}
