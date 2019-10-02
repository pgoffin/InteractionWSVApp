// import { renderFunc } from "../../../global";

import GridLayout from './gridLayout'
import Layout from './Layout'

const layouts: any = {GridLayout};

export default function layoutFactoryClass(aLayoutName: string, theLayout: Layout, initialLayoutInfo, refToText: Text) {

  return new layouts[aLayoutName](initialLayoutInfo, refToText, theLayout)

}
