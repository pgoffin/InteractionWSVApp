import * as d3 from "d3";

import { BBox } from "../../../global";
import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';

interface Entity {
  _entityName: string;

  _entityElement: HTMLElement;
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

    this.getBBoxOfEntity();

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

        this.draw_connection_line('hoveringTrail', this, null)
      });

      this.entityElement.addEventListener('mouseleave', () => {
        console.log('mouseleave on cloned entity');

        this.removeTrail()
      });
    }
  }


  setAsCurrentEntity() {
    // only the entity gets class 'currentEntity'
    this.entityElement.classList.add('currentEntity');
    // this.entityElement.setAttribute('z-index', '6');

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

  // measurements
  getBBoxOfEntity() {

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
    // return theBbox;
  }


  draw_connection_line(type: string, source: Entity, target: Entity) {

    let svgContainer;

    // added the svg to the root body and not the text div, will make calculation easier
    if (d3.select('body svg.' + type).empty()) {
      const height = Number(d3.select('body').style('height').slice(0, -2))
      const width = Number(d3.select('body').style('width').slice(0, -2))

      svgContainer = d3.select('body').insert('svg', ':first-child')
                                      .attr('width', width)
                                      .attr('height', height)
                                      .attr('class', type);
    } else {
      svgContainer = d3.select('body svg.' + type);
    }

    const bboxText = $('#text').offset();
    const bboxBody = $('body').offset();

    let sourceElement;
    let targetElement;

    if (type === 'diffLine') {
      // source element
      sourceElement = source._entityElement;

      // dragged element
      targetElement = target._entityElement;

    } else {

      // origin element
      sourceElement = this._entityBbox;
      // cloned element
      targetElement = this._entityBelongsToWsv._theOriginalWSV._entity._entityBbox;
    }


    const xSource = sourceElement.left + (sourceElement.width/2.0) - bboxBody.left;
    const ySource = sourceElement.top + (sourceElement.height/2.0) - bboxText.top;

    // dragged element
    const xTarget = targetElement.left + (targetElement.width/2.0) - bboxBody.left;
    const yTarget = targetElement.top + (targetElement.height/2.0) - bboxText.top;

    // based on this http://stackoverflow.com/questions/15007877/how-to-use-the-d3-diagonal-function-to-draw-curved-lines
    const s = {x: xSource, y: ySource};
    const t = {x: xTarget, y: yTarget};


    let lineEndpoints;
    let line;
    if (type === 'hoveringTrail') {

      lineEndpoints = {'source': s, 'target': t};

      line = d3.linkHorizontal()
               .x(function(d) { return d.x; })
               .y(function(d) { return d.y; });

    } else {

      lineEndpoints = [[s, t]];

      line = d3.svg.line()
                   .x(function(d) { return d.x; })
                   .y(function(d) { return d.y; });
    }

    // svgContainer.append('path')
    //             .attr('d', line(lineEndpoints))
    //             .attr('class', 'hoveringTrail');

    let theLine = svgContainer.selectAll('.' + type)
                              .data([lineEndpoints]);

    theLine.attr('d', line(lineEndpoints));

    theLine.enter().append('path')
                   .attr('class', type)
                   .attr('d', function(d) {return line(d)})

    theLine.exit().remove();
  }


  removeTrail() {
    d3.select('body .hoveringTrail .hoverTrail').remove();

    d3.select('body .hoveringTrail').remove();
  }



}

export default Entity
