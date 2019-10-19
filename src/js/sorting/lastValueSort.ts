
import Sorter from './sorter';
import WorldScaleVisualization from '../components/wordScaleVisualization';

const dl = require('../../lib/datalib.min.js');



class LastValueSort implements Sorter {

  _dataToSort;
  _comparator;


  constructor(aDataToSort, aRefToText: Text) {
    this._dataToSort = aDataToSort

    this._refToText = aRefToText;
  }



  sort(): Array<WorldScaleVisualization> {
    console.log('sorting using last value');

    this._dataToSort.forEach((aWSV: WorldScaleVisualization) => {
      let wsvsData = aWSV._rawWSVData;
      aWSV.lastDataValue = wsvsData[wsvsData.length - 1]['close']
    });

    this._dataToSort.sort(dl.comparator(['-lastDataValue']));

    return this._dataToSort;
  }


  setComparator(aWSV) {
    this._comparator = aWSV._rawWSVData[aWSV._rawWSVData.length - 1]['close'];
  }


  getComparator(aWSV): number {
    return aWSV._rawWSVData[aWSV._rawWSVData.length - 1]['close'];
  }


  compare(aWSV): string {
    return (this.getComparator(aWSV) > this._comparator) ? 'below' : 'above';
  }

}



export default LastValueSort
