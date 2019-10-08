import { LayoutInfo } from "../../../global";

import WordScaleVisualization from './wordScaleVisualization'



class LayoutType {

  constructor() {

  }

  static getAboveBelowCounts(anArrayOfWSVs: Array<WordScaleVisualization>) {
    const counts = {above: 0, below: 0}

    anArrayOfWSVs.forEach(aWSV => {
      if (aWSV._aboveOrBelow === 'above') {
        counts.above += 1;
      } else if (aWSV._aboveOrBelow === 'below') {
        counts.below += 1;
      }
    })

    return counts;
  }


  static addWhiteLayer(width: number, height: number, oldTop: number, oldLeft: number) {

    const whiteLayerDiv = document.createElement('div');
    whiteLayerDiv.classList.add('whiteLayer');
    document.getElementById('text').append(whiteLayerDiv);

    whiteLayerDiv.style.width = width + 'px';
    whiteLayerDiv.style.height = height + 'px';

    whiteLayerDiv.style.top = oldTop + 'px';
    whiteLayerDiv.style.left = oldLeft + 'px';

    return whiteLayerDiv;
  }


  // get the left, right, top and bottom borders of text div for optimal visualization of wsvs, same for every layout
  static getViewportMeasurements(aLayoutRef: Layout): LayoutInfo {

    let bodyBbox = LayoutType.getBodyBBox();
    let viewportDimensionsLeftRight = {left: bodyBbox.left, right: bodyBbox.right};
    let viewportDimensionsTopBottom = {top: bodyBbox.top, bottom: bodyBbox.bottom};

    let layoutInfo = {};
    if (typeof aLayoutRef !== 'undefined') {
      aLayoutRef.layoutInfo.viewportLeft = viewportDimensionsLeftRight.left;
      aLayoutRef.layoutInfo.viewportRight = viewportDimensionsLeftRight.right;
      aLayoutRef.layoutInfo.viewportTop = viewportDimensionsTopBottom.top;
      aLayoutRef.layoutInfo.viewportBottom = viewportDimensionsTopBottom.bottom;
    } else {
      console.log('PROBLEM: first create the layoutInfo object.')
    }

    return layoutInfo;
  }


  static getBodyBBox(): DOMRect | ClientRect {

    return document.body.getBoundingClientRect();
  }


}

export default LayoutType
