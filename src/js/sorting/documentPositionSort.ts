
import Sorter from './sorter';
import Text from '../components/text'
import WorldScaleVisualization from '../components/wordScaleVisualization';

const dl = require('../../lib/datalib.min.js');



class DocumentPositionSort implements Sorter {

  _dataToSort;
  _refToText;
  _comparator;




  constructor(aDataToSort, aRefToText: Text) {
    this._dataToSort = aDataToSort;
    this._refToText = aRefToText;
  }



  sort(): Array<WorldScaleVisualization> {
    console.log('sorting using document position');

    this._dataToSort.forEach((aWSV: WorldScaleVisualization) => {
      aWSV.distanceToCurrEntity = this._refToText._currentEntity._entityBbox.top - aWSV._entity._entityBbox.top;
    });

    this._dataToSort.sort(dl.comparator(['+_entity._entityBbox.top','-distanceToCurrEntity']));

    return this._dataToSort;
  }


  setComparator(aWSV) {
    this._comparator = aWSV._entity._entityBbox.top;
  }

  getComparator(aWSV): number {
    return aWSV._entity._entityBbox.top
  }


  compare(aWSV): string {
    return (this.getComparator(aWSV) > this._comparator) ? 'below' : 'above';
  }
}



export default DocumentPositionSort
