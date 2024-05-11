export class spatialGrid{
    // Initialize the grid with dimensions and cell size.
    constructor(gridSize, cellSize) {
        this.gridSize = gridSize; // Dimensions of the grid in 3D space.
        this.cellSize = cellSize; // Length of each side of a cubic cell.
        this.cells = {}; // Stores objects with a cell coordinate key.
        // Calculate the number of cells needed along each axis.
        this.dimensions = {
            x: Math.ceil(gridSize.x / cellSize),
            y: Math.ceil(gridSize.y / cellSize),
            z: Math.ceil(gridSize.z / cellSize)
        };
    }

    // Generate a string key based on cell coordinates for identifying cells.
    _cellKey(x, y, z) {
        // Clamp each coordinate to ensure it falls within the grid dimensions
        x = Math.max(0, Math.min(x, this.dimensions.x - 1));
        y = Math.max(0, Math.min(y, this.dimensions.y - 1));
        z = Math.max(0, Math.min(z, this.dimensions.z - 1));
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
    
        // Debug: Log if a boid is added more than once or to multiple cells
         //console.log(`Inserting boid at ${key}. Current cell count: ${this.cells[key].length}`);
        if (this.cells[key].includes(boid)) {
             //console.log("Warning: Boid already exists in this cell.");
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
                    // Check bounds before creating a key
                    let adjX = x + i, adjY = y + j, adjZ = z + k;
                    if (adjX >= 0 && adjX < this.dimensions.x && adjY >= 0 && adjY < this.dimensions.y && adjZ >= 0 && adjZ < this.dimensions.z) {
                        const adjacentKey = this._cellKey(adjX, adjY, adjZ);
                        if (this.cells[adjacentKey]) {
                            nearbyBoids = nearbyBoids.concat(this.cells[adjacentKey]);
                        }
                    }
                }
            }
        }
        return nearbyBoids;
    }
    

    clear() {
        // Reset the cells object, effectively clearing the grid.
        this.cells = {};
    }
  }