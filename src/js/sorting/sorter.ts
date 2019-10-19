import WorldScaleVisualization from '../components/wordScaleVisualization';




interface Sorter {


  sort(): Array<WorldScaleVisualization>;

  setComparator(): void;

  getComparator();

  compare(): string;

}



export default Sorter