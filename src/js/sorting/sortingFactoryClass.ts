// import { RenderFunc } from "../../../global";

import LastValueSort from './lastValueSort';
import DocumentPositionSort from './documentPositionSort';
import EntityNameSort from './entityNameSort';

import Text from '../components/text';
import WordScaleVisualization from '../components/wordScaleVisualization';


const sortingClasses: any = {LastValueSort, DocumentPositionSort, EntityNameSort};


export default function sortingFactoryClass(aSortingClass: string, dataToSort: Array<WordScaleVisualization>, aRefToText: Text) {

  return new sortingClasses[aSortingClass](dataToSort, aRefToText)

}
