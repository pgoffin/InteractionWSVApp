
import Sorter from './sorter';
import Text from '../components/text'
import WordScaleVisualization from '../components/wordScaleVisualization';

const dl = require('../../lib/datalib.min.js');



class EntityNameSort implements Sorter {
  private _dataToSort: Array<WordScaleVisualization>;
  // private _refToText: Text;
  private _comparator: string;




  constructor(aDataToSort: Array<WordScaleVisualization>, aRefToText: Text) {
    this._dataToSort = aDataToSort;
    this._comparator = '';
    // this._refToText = aRefToText;
  }



  sort(): Array<WordScaleVisualization> {
    console.log('sorting using entity name');

    // this._dataToSort.forEach((aWSV: WordScaleVisualization) => {
    //   aWSV.distanceToCurrEntity = this._refToText._currentEntity._entityBbox.top - aWSV._entity._entityBbox.top;
    // });

    this._dataToSort.sort(dl.comparator(['+_entity._entityName']));

    return this._dataToSort;
  }

  sortBackgroundElement(): void {
    const backgroundLayerDiv = document.getElementById('backgroundLayer')!;
    for (const aWSV of this._dataToSort) {
      backgroundLayerDiv.append(aWSV._clonedWSV._backgroundElement);
    }
  }


  setComparator(aWSV: WordScaleVisualization): void {
    this._comparator = aWSV._entity._entityName;
  }

  getComparator(): string {
    return this._comparator;
  }


  compare(aWSV: WordScaleVisualization): string {
    return (aWSV._entity._entityName > this.getComparator()) ? 'below' : 'above';
  }
}



export default EntityNameSort
