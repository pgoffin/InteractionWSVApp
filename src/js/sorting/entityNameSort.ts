import Sorter from './sorter';
import Text from '../components/text'
import WordScaleVisualization from '../components/wordScaleVisualization';

const dl = require('../../lib/datalib.min.js');



class EntityNameSort implements Sorter {
  private _dataToSort: Array<WordScaleVisualization>;
  private _refToText: Text;



  constructor(aDataToSort: Array<WordScaleVisualization>, aRefToText: Text) {
    this._dataToSort = aDataToSort;
    this._refToText = aRefToText;
  }



  sort(): Array<WordScaleVisualization> {
    console.log('sorting using entity name');

    this._dataToSort.sort(dl.comparator(['+_entity._entityName']));

    return this._dataToSort;
  }


  sortBackgroundElements(): void {
    const backgroundLayerDiv = document.getElementById('backgroundLayer')!;
    for (const aWSV of this._dataToSort) {
      let aClonedWSV = aWSV._clonedWSV;
      if (aClonedWSV) backgroundLayerDiv.append(aClonedWSV._backgroundElement!);
    }
  }


  getComparator(aWSV: WordScaleVisualization): string {
    return aWSV._entity._entityName;
  }


  getCurrentWSVComparator(): string {
      return this.getComparator(this._refToText._currentEntity!._entityBelongsToWsv);
  }


  compareToCurrentWSV(aWSV: WordScaleVisualization): string {
    return (this.getComparator(aWSV) > this.getCurrentWSVComparator()) ? 'below' : 'above';
  }
}

export default EntityNameSort
