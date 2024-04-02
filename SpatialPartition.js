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
        return `${x}_${y}_${z}`;
    }

    insertBoidAtPosition(boid, position) {
        // Calculate the cell indices based on the position.
        const x = Math.floor(position.x / this.cellSize);
        const y = Math.floor(position.y / this.cellSize);
        const z = Math.floor(position.z / this.cellSize);
    
        // Generate the cell's unique key.
        const key = this._cellKey(x, y, z);
    
        // Initialize the cell's array if it doesn't already exist.
        if (!this.cells[key]) {
            this.cells[key] = [];
        }
    
        // Add the boid to the cell.
        this.cells[key].push(boid);
    
        // Additionally, set the boid's spatialKey to the cell key for easy reference.
        boid.updateSpatialKey(key);
    }

    getBoidsInAdjacentCellsByKey(spatialKey) {
        // Initialize an array to hold all nearby boids
        let nearbyBoids = [];
    
        // Parse the spatialKey to get x, y, z indices of the cell
        const [x, y, z] = spatialKey.split("_").map(Number);
    
        // Iterate over the target cell and its adjacent cells in all directions
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    // Calculate the key for the current adjacent cell
                    const adjacentKey = this._cellKey(x + i, y + j, z + k);
                    
                    // If the cell exists, add its boids to the nearbyBoids array
                    if (this.cells[adjacentKey]) {
                        nearbyBoids = nearbyBoids.concat(this.cells[adjacentKey]);
                    }
                }
            }
        }
    
        // Return the aggregated list of boids from the adjacent cells
        return nearbyBoids;
    }

    clear() {
        // Reset the cells object, effectively clearing the grid.
        this.cells = {};
    }
  }