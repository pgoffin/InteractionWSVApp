import WordScaleVisualization from '../components/wordScaleVisualization';


interface Sorter {

  sort(): Array<WordScaleVisualization>;

  sortBackgroundElements(): void;

  getComparator(aWSV: WordScaleVisualization): any;

  getCurrentWSVComparator(): any;

  compareToCurrentWSV(aWSV: WordScaleVisualization): string;

}

export default Sorter
