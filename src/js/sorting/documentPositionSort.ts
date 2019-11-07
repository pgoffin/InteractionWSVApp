
import Sorter from './sorter';
import Text from '../components/text'
import WordScaleVisualization from '../components/wordScaleVisualization';

const dl = require('../../lib/datalib.min.js');



class DocumentPositionSort implements Sorter {
  private _dataToSort: Array<WordScaleVisualization>;
  private _refToText: Text;
  private _comparator: number;



  constructor(aDataToSort, aRefToText: Text) {
    this._dataToSort = aDataToSort;
    this._refToText = aRefToText;
    this._comparator = 0;
  }



  sort(): Array<WordScaleVisualization> {
    console.log('sorting using document position');

    this._dataToSort.forEach((aWSV: WordScaleVisualization) => {
      aWSV.distanceToCurrEntity = this._refToText._currentEntity!._entityBbox.top - aWSV._entity._entityBbox.top;
    });

    this._dataToSort.sort(dl.comparator(['+_entity._entityBbox.top','-distanceToCurrEntity']));

    return this._dataToSort;
  }

  sortBackgroundElement(): void {
    const backgroundLayerDiv = document.getElementById('backgroundLayer')!;
    for (const aWSV of this._dataToSort) {
      backgroundLayerDiv.append(aWSV._clonedWSV._backgroundElement);
    }
  }


  setComparator(aWSV: WordScaleVisualization) {
    this._comparator = aWSV._entity._entityBbox.top;
  }

  getComparator(): number {
    return this._comparator;
  }


  compare(aWSV: WordScaleVisualization): string {
    return (aWSV._entity._entityBbox.top > this._comparator) ? 'below' : 'above';
  }
}



export default DocumentPositionSort
