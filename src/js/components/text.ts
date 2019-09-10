import * as d3 from "d3";
import { contextualMenu } from './contextualMenu';
import { layout } from './layout'

// import historianData from "../../data/otherDataset"
const historianData = require("../../data/otherDataset")
const constants = require('../constants');

require('webpack-jquery-ui/widgets');
const renderers = require('../../lib/renderers');
require('../../lib/jquery.sparklificator');


class Text {

  _nameOfTextFile: string = this.getTextFileName();

  _isLayoutVisible: Boolean = false;

  initializeText() {
    console.log('initializing some text')

    // check if there is data for each entity if no data is available remove the entity tag
    this.removeEntitiesWithNoData();
    this.addWSV(constants.typeOfWSV);

    layout.initializeLayout();

    contextualMenu.initializeContextualMenu(this);

    this.addEventToEntities(contextualMenu);
  }


  get isLayoutVisible() {
    return this._isLayoutVisible;
  }


  /*
    remove the entity tag for tagged entities that do not have any data
   */
  private removeEntitiesWithNoData(): void {

    // const nameOfTextFile = this.getTextFileName();
    const classThis = this;

    $('.entity').each(function(index, value) {
      // does entity have data available?
      let anEntity = classThis.getEntityFromDOMElement(value);
      let datasetType = classThis.getDataset(this.dataset.wsvType)

      if ((typeof(datasetType) == 'undefined') || ((typeof datasetType[classThis._nameOfTextFile][anEntity] == 'undefined') || (datasetType[classThis._nameOfTextFile][anEntity].length == 0))) {
        // console.log(anEntity)
        // no data available remove the entity tag
        $(value).contents().unwrap();
      }
    });
  }


  private addWSV(aTypeOfWSV: string): void {

    const classThis = this;

    $('.entity').each(function(index, value) {

      let settings;
      if (aTypeOfWSV === 'timeline') {

// var theData;
        let anEntity = classThis.getEntityFromDOMElement(value);
        let datasetType = classThis.getDataset(this.dataset.wsvType)

// if ((typeof theDataset[nameOfTextFile][anEntity] !== 'undefined') && (theDataset[nameOfTextFile][anEntity].length !== 0)) {

        const startPointDate = Date.parse('1 January 1850');
        // const endPointDate = Date.parse('1 January 1970');

        let dataObject = datasetType[classThis._nameOfTextFile][anEntity];
        let startDate = Date.parse(dataObject.dates[0]);
        let endDate = Date.parse(dataObject.dates[1]);

        dataObject.numberOfDays = Math.round((endDate - startDate)/(1000*60*60*24))
        dataObject.startPoint = Math.round((startDate - startPointDate)/(1000*60*60*24))

        settings = {data: dataObject,
                    renderer: renderers.buildWikiChart,
                    position: constants.positionType,
                    paddingWidth: true,
                    paddingHeight: true,
                    width: constants.timelineSize.width,
                    height: constants.timelineSize.height };
        }

      $(value).sparklificator();
      $(value).sparklificator('option', settings);
    });
  }


  private addEventToEntities(aContextualMenu: ContextualMenu) {
    // instead of mouseover use mouseenter and mouseleave, see http://stackoverflow.com/questions/6274495/changing-opacity-with-jquery
    $('.entity').mouseenter((event) => {
      aContextualMenu.showContextMenu(event.currentTarget);
    });

    $('.entity').mouseleave(function() {
      console.log('mouseleave');
      aContextualMenu.startMenuHideTimer();
    });
  }


  /*
    file name is build from the title by exchanging spaces with underscores
  */
  private getTextFileName(): string {
    return $.trim($('h2').text()).split(' ').join('_');
  }


  private getDataset(aWSVType: string): object {
    if (aWSVType == 'historianData') {
      return historianData;
    }
  }


  private getEntityFromDOMElement(aDOMElement: HTMLElement): string {
    return $.trim(d3.select(aDOMElement).html());
  }

}


export let text = new Text()
