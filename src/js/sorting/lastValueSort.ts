
import Sorter from './sorter';
import WordScaleVisualization from '../components/wordScaleVisualization';

const dl = require('../../lib/datalib.min.js');



class LastValueSort implements Sorter {

  private _dataToSort: Array<WordScaleVisualization>;
  private _refToText: Text;
  private _comparator: number;



  constructor(aDataToSort: Array<WordScaleVisualization>, aRefToText: Text) {
    this._dataToSort = aDataToSort

    this._refToText = aRefToText;
    this._comparator = 0;
  }



  sort(): Array<WordScaleVisualization> {
    console.log('sorting using last value');

    this._dataToSort.forEach((aWSV: WordScaleVisualization) => {
      let wsvsData = aWSV._rawWSVData;
      aWSV.lastDataValue = wsvsData[wsvsData.length - 1]['close']
    });

    this._dataToSort.sort(dl.comparator(['-lastDataValue']));

    return this._dataToSort;
  }


  setComparator(aWSV: WordScaleVisualization) {
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
