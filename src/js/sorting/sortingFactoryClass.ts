// import { RenderFunc } from "../../../global";

import LastValueSort from './lastValueSort';
import DocumentPositionSort from './documentPositionSort';

const sortingClasses: any = {LastValueSort, DocumentPositionSort};


export default function sortingFactoryClass(aSortingClass: string, dataToSort, aRefToText) {

  return new sortingClasses[aSortingClass](dataToSort, aRefToText)

}
