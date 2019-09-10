



class Layout {

    _layoutInfo = {type: '',
                  topLeftCorner_left: 0,
                  topLeftCorner_top: 0,
                  numberOfColumns: 0,
                  cell_dimensions: {width: 0, height: 0},
                  spaceBetweenGridCells: 0,
                  viewportLeft: 0,
                  viewportRight: 0,
                  viewportTop: 0,
                  viewportBottom: 0};

    initializeLayout() {

      this._layoutInfo.spaceBetweenGridCells = 4;
    }

}

export let layout = new Layout()
