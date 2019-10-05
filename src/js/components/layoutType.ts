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

}

export default LayoutType
