import { LayoutInfo, SpaceAvailability } from "../../../global";

import LayoutCreator from './layoutCreator';
import Layout from './layout';
import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';

import ColumnLayout from './columnLayout';
import ColumnPanAlignedLayout from './columnPanAlignedLayout';
import GridLayout from './gridLayout';
import GridNoOverlapLayout from './gridNoOverlapLayout';
import RowLayout from './rowLayout';


class ConcreteLayoutCreator extends LayoutCreator {

  readonly _layouts = {GridLayout, ColumnLayout, ColumnPanAlignedLayout, RowLayout, GridNoOverlapLayout};


  constructor(aRefToText: Text) {
    super(aRefToText);
    console.log('the concreteLayoutCreator constructor');
  }


  get layouts() {
    return this._layouts;
  }


  layoutFactory(aLayoutName: string, aLayoutInfo: LayoutInfo, spaceAvailability: SpaceAvailability, refToText: Text, wsvsWithoutCurrentWSV: Array<WordScaleVisualization>): Layout {

    return new this.layouts[aLayoutName](aLayoutInfo, spaceAvailability, refToText, wsvsWithoutCurrentWSV)

  }

}

export default ConcreteLayoutCreator
