// import { renderFunc } from "../../../global";

// import StockPriceSparkline from './stockPriceSparkline'

const layouts: any = {};

export default function layoutFactoryClass(aLayoutName) {

  return new layouts[aLayoutName]()

}
