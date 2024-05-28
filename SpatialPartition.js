export class spatialGrid{ 
    constructor(gridSize, cellSize) {
        this.gridSize = gridSize;  
        this.cellSize = cellSize;  
        this.cells = {};  
        this.dimensions = {
            x: Math.ceil(gridSize.x / cellSize),
            y: Math.ceil(gridSize.y / cellSize),
            z: Math.ceil(gridSize.z / cellSize)
        };
    } 
    _cellKey(x, y, z) {
        return `${x}_${y}_${z}`;
    }

    insertBoidAtPosition(boid, position) { 
        const x = Math.floor(position.x / this.cellSize);
        const y = Math.floor(position.y / this.cellSize);
        const z = Math.floor(position.z / this.cellSize); 
        const key = this._cellKey(x, y, z); 
        if (!this.cells[key]) {
            this.cells[key] = [];
        } 
        this.cells[key].push(boid); 
        boid.updateSpatialKey(key);
    }  

    getBoidsInAdjacentCellsByKey(spatialKey) { 
        let nearbyBoids = []; 
        const [x, y, z] = spatialKey.split("_").map(Number); 
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) { 
                    const adjacentKey = this._cellKey(x + i, y + j, z + k); 
                    if (this.cells[adjacentKey]) {
                        nearbyBoids = nearbyBoids.concat(this.cells[adjacentKey]);
                    }
                }
            }
        } 
        return nearbyBoids;
    }

    clear() { 
        this.cells = {};
    }
  }