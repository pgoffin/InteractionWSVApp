import { LayoutInfo } from "../../../global";

import LayoutCreator from './layoutCreator'
import Layout from './layout'

import GridLayout from './gridLayout';
import ColumnLayout from './columnLayout';
import ColumnPanAlignedLayout from './columnPanAlignedLayout';
import RowLayout from './rowLayout';
import GridNoOverlapLayout from './gridNoOverlapLayout';
import Text from './text'
import WordScaleVisualization from './wordScaleVisualization';


class ConcreteLayoutCreator extends LayoutCreator {

  layouts: any = {GridLayout, ColumnLayout, ColumnPanAlignedLayout, RowLayout, GridNoOverlapLayout};

  contructor() {
    
  }

  layoutFactoryClass(aLayoutName: string, initialLayoutInfo: LayoutInfo, refToText: Text, arrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>): Layout {

    return new this.layouts[aLayoutName](initialLayoutInfo, refToText, arrayOfWSVsWithouCurrentWSV)

  }

}

export default ConcreteLayoutCreator
