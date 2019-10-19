import { BBox } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';

import * as d3 from "d3";


interface Entity {
  _entityName: string;
  _entityElement: HTMLElement;
  _isSelected: Boolean;
  _isCurrentEntity: Boolean;
  _entityBbox: BBox;
  _entityBelongsToWsv: WordScaleVisualization;
  _isAClone: Boolean;
  _refToText: Text;
}



class Entity implements Entity {

  _entityName: string;
  _entityElement: HTMLElement;
  _refToText: Text;
  _isSelected: Boolean;
  _isCurrentEntity: Boolean;
  _entityBbox: BBox;
  _entityBelongsToWsv: WordScaleVisualization;
  _isAClone: Boolean;


  // getter/setter
  set entityName(value: string) {
      this._entityName = value;
  }
  get entityName(): string {
      return this._entityName;
  }

  set entityElement(value: HTMLElement) {
      this._entityElement = value;
  }
  get entityElement(): HTMLElement {
      return this._entityElement;
  }



  constructor(anElement: HTMLElement, refToText: Text, theWSV: WordScaleVisualization, aIsAClone: Boolean) {
    this.entityName = anElement.innerText;
    this.entityElement = anElement;
    this._refToText = refToText;
    this._isSelected = false;
    this._isCurrentEntity = false;

    this._isAClone = aIsAClone;

    this._entityBelongsToWsv = theWSV;

    this.setBBoxOfEntity();

    this.addEventsToEntity()
  }


  addEventsToEntity() {
    // instead of mouseover use mouseenter and mouseleave, see http://stackoverflow.com/questions/6274495/changing-opacity-with-jquery

    if (!this._isAClone) {
      this.entityElement.addEventListener('mouseenter', () => {
        console.log('mouseenter');

        if (!this._refToText.isLayoutVisible) {

          this._refToText._contextualMenu.showContextMenu(this);

          this.setAsCurrentEntity()
        }
      });

      this.entityElement.addEventListener('mouseleave', () => {
        console.log('mouseleave');

        this._refToText._contextualMenu.startMenuHideTimer(this);
      });

    } else {

      this.entityElement.addEventListener('mouseenter', () => {
        console.log('mouseenter on cloned entity');

        this.drawHoveringnLineTo(this._entityBelongsToWsv._originalWSV._entity)
      });

      this.entityElement.addEventListener('mouseleave', () => {
        console.log('mouseleave on cloned entity');

        this.removeHoverTrail();
      });
    }
  }


  setAsCurrentEntity() {
    // only the entity gets class 'currentEntity'
    this.entityElement.classList.add('currentEntity');

    if (this.entityElement.classList.contains('selected')) {
      this.entityElement.classList.remove('selected');
    }

    this._refToText.currentEntity = this;
    this._refToText.currentWSV = this._entityBelongsToWsv;

    this._isCurrentEntity = true;
  }


  unSetAsCurrentEntity() {
    this.entityElement.classList.remove('currentEntity')

    this._refToText.currentEntity = null;

    this._isCurrentEntity = false;
  }


  setAsSelected() {
    this.entityElement.classList.add('selected');

    this._isSelected = true
  }


  setBBoxOfEntity() {

    const theBbox = { left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 0,
                    height: 0};


    // adapt top and bottom to give values according to the document
    let bbox = this.entityElement.getBoundingClientRect();

    // let scrollingOffset = $(window).scrollTop();
    let scrollingOffset = document.body.scrollTop;

    theBbox.left = bbox.left;
    theBbox.top = bbox.top + scrollingOffset;
    theBbox.right = bbox.right;
    theBbox.bottom = bbox.bottom + scrollingOffset;
    theBbox.width = bbox.width;
    theBbox.height = bbox.height;

    this._entityBbox = theBbox;
  }


  drawHoveringnLineTo(target: Entity) {

    let svgContainer;

    // added the svg to the root body and not the text div, will make calculation easier
    if (d3.select('#bodyOverlay').empty()) {
      const height = Number(d3.select('body').style('height').slice(0, -2))
      const width = Number(d3.select('body').style('width').slice(0, -2))

      svgContainer = d3.select('body').insert('svg', ':first-child')
                                      .attr('width', width)
                                      .attr('height', height)
                                      .attr('id', 'bodyOverlay');
    } else {
      svgContainer = d3.select('#bodyOverlay');
    }

    // const bboxText = {top: document.getElementById('text').getBoundingClientRect().top, left: document.getElementById('text').getBoundingClientRect().left}
    // const bboxBody = {top: document.body.getBoundingClientRect().top - document.body.scrollTop, left: document.body.getBoundingClientRect().left}
    const bboxText = $('#text').offset();
    const bboxBody = $('body').offset();


    // cloned element
    let sourceElementBBox: BBox = this._entityBbox;
    // origin element
    let targetElementBBox: BBox = target._entityBbox;

    const xSource = sourceElementBBox.left + (sourceElementBBox.width/2.0) - bboxBody.left;
    const ySource = sourceElementBBox.top + (sourceElementBBox.height/2.0) - bboxBody.top;

    // dragged element
    const xTarget = targetElementBBox.left + (targetElementBBox.width/2.0) - bboxBody.left;
    const yTarget = targetElementBBox.top + (targetElementBBox.height/2.0) - bboxText.top;

    // based on this http://stackoverflow.com/questions/15007877/how-to-use-the-d3-diagonal-function-to-draw-curved-lines
    const s = {x: xSource, y: ySource};
    const t = {x: xTarget, y: yTarget};


    let line;

    const lineEndpoints = {'source': s, 'target': t};

    const curvedline = d3.linkHorizontal()
                         .x(function(d) { return d.x; })
                         .y(function(d) { return d.y; });

    // svgContainer.append('path')
    //             .attr('d', line(lineEndpoints))
    //             .attr('class', 'hoveringTrail');

    const theLine = svgContainer.selectAll('.hoverTrail')
                                .data([lineEndpoints]);

    theLine.attr('d', curvedline(lineEndpoints));

    theLine.enter().append('path')
                   .attr('class', 'hoverTrail')
                   .attr('d', function(d) {return curvedline(d)})

    theLine.exit().remove();
  }


  removeBodyOverlay() {
    d3.select('#bodyOverlay').remove();
  }


  removeHoverTrail() {
    d3.select('.hoverTrail').remove();
  }


  getDifftoCurrEntity(currentEntity: Entity): number {
    return currentEntity._entityBbox.width - this._entityBbox.width;
  }

}

export default Entity
