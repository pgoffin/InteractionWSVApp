import WordScaleVisualization from '../components/wordScaleVisualization';


interface Sorter {

  sort(): Array<WordScaleVisualization>;

  setComparator(aWSV: WordScaleVisualization): void;

  getComparator(): any;

  compare(aWSV: WordScaleVisualization): string;

}



export default Sorter
