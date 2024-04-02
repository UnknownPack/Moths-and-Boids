import * as THREE from 'three';
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

    

    visualize() {
        console.log(`Grid Size: ${this.gridSize.x} x ${this.gridSize.y} x ${this.gridSize.z}`);
        console.log(`Cell Size: ${this.cellSize}`);
        console.log(`Grid Dimensions: ${this.dimensions.x} x ${this.dimensions.y} x ${this.dimensions.z}`);
        for (let z = 0; z < this.dimensions.z; z++) {
            console.log(`Layer ${z}:`);
            for (let y = 0; y < this.dimensions.y; y++) {
                let row = '';
                for (let x = 0; x < this.dimensions.x; x++) {
                    const key = this._cellKey(x, y, z);
                    // Mark the cell with 'B' if it contains boids, otherwise use '.'.
                    row += this.cells[key] && this.cells[key].length > 0 ? 'B' : '.';
                }
                console.log(row);
            }
            console.log('\n'); // Separate each layer for clarity.
        }
    }
    
 
}