import { renderFunc } from "../../../global";

import StockPriceSparkline from './stockPriceSparkline'

const wsvSparklineClasses: any = {StockPriceSparkline};

export default function wsvFactoryClass(aRendererClass: string, aRenderer: renderFunc, aRawWSVData: Array<object>, aPositionType: string, aPaddingWidth: Boolean, aPaddingHeight: Boolean) {
  return new wsvSparklineClasses[aRendererClass](aRenderer, aRawWSVData, aPositionType, aPaddingWidth, aPaddingHeight)
}
