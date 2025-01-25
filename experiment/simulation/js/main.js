function openPart(evt, name){
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(name).style.display = "block";
    evt.currentTarget.className += " active";

}
function startup() {
    document.getElementById("default").click();
}

window.onload = startup;


initializeTask3Simulation();
initializeTask1Simulation();


//______________________________________________________________________________________________________________________________
function initializeTask1Simulation(){
const slider = document.getElementById('distance-slider');
const transmitter = document.getElementById('transmitter');
const receiver = document.getElementById('receiver');
const txHeightInput = document.getElementById('tx-height');
const rxHeightInput = document.getElementById('rx-height');
const distanceDisplay = document.getElementById('distance');
const pathLossDisplay = document.getElementById('path-loss');
const registerBtn = document.getElementById('register-btn');
const plotBtn = document.getElementById('plot-btn');
const resetBtn = document.getElementById('resetBtn');
const chartCanvas = document.getElementById('pathloss-chart');
const valuesTableBody = document.querySelector('#values-table tbody');
const sliderDisplay = document.getElementById('sliderDisplay');


const maxDistance = 2000; // Maximum distance in meters

slider.max = maxDistance;
let curves = [];
resetBtn.addEventListener('click', () => {
    // Clear all curves
    curves = [];
    
    // Clear the table
    valuesTableBody.innerHTML = '';
    
    // Reset the chart
    if (Chart.getChart(chartCanvas)) {
        Chart.getChart(chartCanvas).destroy();
    }
    
    slider.value = slider.min;
    sliderDisplay.textContent = slider.value;
    
    const txHeight = parseInt(slider.min);
    const rxHeight = parseInt(slider.min);
    
    updateAntennaImage(txHeight, transmitter.querySelector('img'));
    updateAntennaImage(rxHeight, receiver.querySelector('img'));
    
    showNotification("All curves and data have been reset!");
});

function calculatePathLoss(G, distance, frequency, ht, hr) {
    const c = 3 * 1e8;
    const lamda = c / frequency;
    const dc = (4 * ht * hr) / lamda;
    const d = distance;
    let path_loss;
    if (d < dc) {
        path_loss = 20 * (Math.log10(4 * Math.PI) + Math.log10(d) - Math.log10(lamda) - (Math.log10(G) * 1 / 2));
    } else {
        path_loss = 20 * (2 * Math.log10(d) - Math.log10(hr) - Math.log10(ht) - (Math.log10(G) * 1 / 2));
    }
    return path_loss;
}

function updateAntennaImage(height, imgElement) {
    if (!imgElement) {
        console.error("Image element is invalid or not found.");
        return;
    }

    if (height <= 50) {
        imgElement.src = './images/antenna-small.svg';
        imgElement.style.width = `${height + 30}px`;
    } else if (height <= 100) {
        imgElement.src = './images/antenna-medium.svg';
        imgElement.style.width = '80px';
    } else {
        imgElement.src = './images/antenna-large.svg';
        imgElement.style.width = '100px';
    }

    imgElement.style.height = 'auto';
}

function updateAntennaHeights() {
    const txHeight = Math.min(parseInt(txHeightInput.value), 150);
    const rxHeight = Math.min(parseInt(rxHeightInput.value), 150);

    updateAntennaImage(txHeight, transmitter.querySelector('img'));
    updateAntennaImage(rxHeight, receiver.querySelector('img'));

    updatePathLoss();
}

function updateReceiverPosition() {
    const distance = parseInt(slider.value); // Slider value as distance
    const experimentPadding = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--experiment-padding'));
    const experimentWidth = document.getElementById('experiment-area').offsetWidth;

    // Calculate receiver's horizontal position
    const receiverWidth = receiver.offsetWidth / 2; // Half the width to center the antenna
    const receiverX = Math.min(
        experimentWidth - experimentPadding - receiverWidth, // Ensure it doesn't exceed the right boundary
        Math.max(
            experimentPadding - receiverWidth, // Ensure it doesn't exceed the left boundary
            experimentPadding + (distance / maxDistance) * (experimentWidth - 2 * experimentPadding)
        )
    );

    receiver.style.left = `${receiverX}px`;
}


function updatePathLoss() {
    const distance = parseInt(slider.value); // Slider value as distance
    const G = parseFloat(document.getElementById("G").value);
    const txHeight = parseInt(txHeightInput.value) || 1; // Ensure height is at least 1
    const rxHeight = parseInt(rxHeightInput.value) || 1;
    const fc = parseFloat(document.getElementById("fc").value);
    const fc_Hz = fc * 1000000;
    distanceDisplay.textContent = distance;
    const pathLoss = calculatePathLoss(G, distance, fc_Hz, txHeight, rxHeight).toFixed(2);
    pathLossDisplay.textContent = pathLoss;

    updateReceiverPosition();
}

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = isError ? 'notification error' : 'notification';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function registerValues() {
    const distance = parseInt(slider.value);
    const txHeight = parseInt(txHeightInput.value) || 1;
    const rxHeight = parseInt(rxHeightInput.value) || 1;
    const pathLoss = parseFloat(pathLossDisplay.textContent);
    
    // Find existing curve for current height configuration
    let curveIndex = curves.findIndex(curve => 
        curve.txHeight === txHeight && curve.rxHeight === rxHeight
    );
    
    if (curveIndex === -1) {
        // Create new curve if height configuration doesn't exist
        if (curves.length >= 5) {
            showNotification("Maximum of 5 different height configurations reached!", true);
            return;
        }
        
        curves.push({
            txHeight,
            rxHeight,
            dataPoints: [],
            color: `hsl(${curves.length * 60}, 70%, 50%)`  // Different color for each curve
        });
        curveIndex = curves.length - 1;
    }
    
    let curve = curves[curveIndex];
    
    // Check if we already have a measurement at this distance for this curve
    const existingPointIndex = curve.dataPoints.findIndex(point => point.distance === distance);
    if (existingPointIndex !== -1) {
        showNotification("A measurement at this distance already exists for these heights!", true);
        return;
    }
    
    // Add new point and sort by distance
    curve.dataPoints.push({ distance, pathLoss });
    curve.dataPoints.sort((a, b) => a.distance - b.distance);
    
    // Update table
    updateTable();
    
    showNotification(`Registered: Distance=${distance}m, Path Loss=${pathLoss}dB (Tx=${txHeight}m, Rx=${rxHeight}m)`);
    
    // Update plot
    plotGraph();
}

function updateTable() {
    valuesTableBody.innerHTML = '';
    curves.forEach((curve, index) => {
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <td colspan="3" style="background-color: ${curve.color}20">
                Tx Height: ${curve.txHeight}m, Rx Height: ${curve.rxHeight}m
            </td>
        `;
        valuesTableBody.appendChild(headerRow);
        
        curve.dataPoints.forEach(point => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${point.distance}</td>
                <td>${point.pathLoss}</td>
            `;
            valuesTableBody.appendChild(row);
        });
    });
}
function plotGraph() {
    if (curves.length === 0) {
        showNotification("No data to plot. Please register values first!", true);
        return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);

    if (Chart.getChart(chartCanvas)) {
        Chart.getChart(chartCanvas).destroy();
    }
    
    // Set canvas background to white
    chartCanvas.style.backgroundColor = 'white';
    
    const datasets = curves.map(curve => ({
    label: `Tx=${curve.txHeight}m, Rx=${curve.rxHeight}m`,
    data: curve.dataPoints.map(point => ({
        x: point.distance,
        y: point.pathLoss
    })),
    borderColor: curve.color,
    backgroundColor: 'rgba(118, 223, 237, 0.25)', // Transparent background
    borderWidth: 2,
    fill: true
}));
    
    new Chart(chartCanvas, {
        type: 'line',
        data: { 
            datasets,
            // Add explicit background color for the chart area
            backgroundColor: 'white'
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distance (m)',
                        color: '#333'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBackground: true
                    },
                    ticks: {
                        color: '#333'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Path Loss (dB)',
                        color: '#333'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBackground: true
                    },
                    ticks: {
                        color: '#333'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#333',
                        usePointStyle: true,
                        padding: 20
                    },
                    backgroundColor: 'white'
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: '#ddd',
                    borderWidth: 1
                }
            },
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 10
                }
            }
        },
        plugins: [{
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart, args, options) => {
                const {ctx} = chart;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        }]
    });
}
// Event Listeners
slider.addEventListener('input', updatePathLoss);
txHeightInput.addEventListener('input', updateAntennaHeights);
rxHeightInput.addEventListener('input', updateAntennaHeights);
registerBtn.addEventListener('click', registerValues);
plotBtn.addEventListener('click', plotGraph);
updatePathLoss();
}








// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~task_3~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// Function to initialize task3 simulation
function initializeTask3Simulation() {
    const gridSize = 20;
    const rows = 31;
    const cols = 31; 
    const transmitr= { x: 15, y: 15 }; // Transmitter position (grid coordinates)

    const simulationArea = document.getElementById("simulation");
    simulationArea.style.gridTemplateRows = `repeat(${rows}, ${gridSize}px)`;
    simulationArea.style.gridTemplateColumns = `repeat(${cols}, ${gridSize}px)`;

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    const cells = []; // Store cells for easy manipulation

    // Generate grid with pathloss values
    for (let row = 0; row < rows; row++) {
        cells[row] = [];
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");

            // Calculate distance from transmitter
            const distance = Math.sqrt((col - transmitr.x) ** 2 + (row - transmitr.y) ** 2);

            // Compute pathloss value (example formula)
            const pathloss = 20 * Math.log10(distance + 1); // Adding 1 to avoid log(0)

            // Set background color based on pathloss value (heatmap effect)
            const intensity = Math.min(255, Math.max(0, 255 - pathloss * 5));
            cell.style.backgroundColor = `rgb(${255 - intensity}, ${intensity}, ${intensity})`;

            simulationArea.appendChild(cell);
            cells[row][col] = { 
                element: cell, 
                basePathloss: pathloss, 
                currentPathloss: pathloss,
                shadows: [] // Store individual shadow contributions
            };
        }
    }

    // Helper function to check if a point is shadowed by an obstacle
    function isPointShadowed(x, y, obstacleX, obstacleY) {
        // Vector from transmitter to obstacle
        const vectToObstacle = {
            x: obstacleX - transmitr.x,
            y: obstacleY - transmitr.y
        };
        
        // Vector from transmitter to point
        const vectToPoint = {
            x: x - transmitr.x,
            y: y - transmitr.y
        };
        
        // Distance from transmitter to obstacle and point
        const distToObstacle = Math.sqrt(vectToObstacle.x ** 2 + vectToObstacle.y ** 2);
        const distToPoint = Math.sqrt(vectToPoint.x ** 2 + vectToPoint.y ** 2);
        
        // If point is closer to transmitter than obstacle, it's not shadowed
        if (distToPoint <= distToObstacle) {
            return { isShadowed: false, strength: 0 };
        }
        
        // Calculate dot product
        const dotProduct = vectToObstacle.x * vectToPoint.x + vectToObstacle.y * vectToPoint.y;
        const cosAngle = dotProduct / (distToObstacle * distToPoint);
        
        // Calculate shadow strength based on alignment
        if (cosAngle > 0.95) { // About 18 degrees
            const strength = (cosAngle - 0.95) / 0.05; // Normalize to 0-1
            return { 
                isShadowed: true, 
                strength: strength,
                distance: distToPoint - distToObstacle // Distance traveled in shadow
            };
        }
        
        return { isShadowed: false, strength: 0 };
    }

    // Function to combine multiple shadow effects
    function combineShadowEffects(shadows) {
        if (shadows.length === 0) return 0;
        
        // Sort shadows by strength
        shadows.sort((a, b) => b.strength - a.strength);
        
        // Primary shadow effect (strongest shadow)
        let totalAttenuation = shadows[0].strength * 2;
        
        // Additional shadows contribute logarithmically less
        for (let i = 1; i < shadows.length; i++) {
            const additionalAttenuation = (shadows[i].strength * 2) / (i + 1);
            totalAttenuation += additionalAttenuation;
        }
        
        // Scale attenuation based on distance traveled in shadow
        shadows.forEach(shadow => {
            const distanceScale = Math.log10(shadow.distance + 1) / 2;
            totalAttenuation *= (1 + distanceScale);
        });
        
        return totalAttenuation;
    }

    // Function to update cell pathloss and return the new value
    function updateCellPathloss(row, col, obstacles) {
        const cell = cells[row][col];
        
        if (!cell.element.classList.contains("obstacle")) {
            // Reset shadows array
            cell.shadows = [];
            
            // Check shadows from all obstacles
            for (const obstacle of obstacles) {
                const shadowInfo = isPointShadowed(col, row, obstacle.x, obstacle.y);
                if (shadowInfo.isShadowed) {
                    cell.shadows.push(shadowInfo);
                }
            }
            
            // Calculate combined shadow effect
            const shadowAttenuation = combineShadowEffects(cell.shadows);
            cell.currentPathloss = cell.basePathloss + shadowAttenuation;

            // Update cell color based on new pathloss
            const intensity = Math.min(255, Math.max(0, 255 - cell.currentPathloss * 5));
            cell.element.style.backgroundColor = `rgb(${255 - intensity}, ${intensity}, ${intensity})`;
        }
        
        return cell;
    }

    // Update pathloss values when obstacles are placed
function updatePathloss() {
// Find all obstacles
const obstacles = [];
let totalPathloss = 0;
let cellCount = 0;

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        if (cells[row][col].element.classList.contains("obstacle")) {
            obstacles.push({ x: col, y: row });
        }
    }
}

// Update all cells and calculate average pathloss
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const cell = updateCellPathloss(row, col, obstacles);
        
        if (!cell.element.classList.contains("obstacle")) {
            totalPathloss += cell.currentPathloss;
            cellCount++;
        }
    }
}

// Update average pathloss in output section
const averagePathloss = totalPathloss / cellCount;
document.getElementById("output-info").textContent = `Average Pathloss: ${averagePathloss.toFixed(2)}`;
}

    // Place obstacles
    simulationArea.addEventListener("click", (e) => {
        const cell = e.target;
        if (cell && cell.classList.contains("cell")) {
            cell.classList.toggle("obstacle");
            updatePathloss();
            
            // Update tooltip immediately if it's visible
            const hoveredCell = document.querySelector(".cell:hover");
            if (hoveredCell) {
                updateTooltip(hoveredCell);
            }
        }
    });

    // Function to update tooltip content
    function updateTooltip(cell) {
        const row = Math.floor(Array.from(simulationArea.children).indexOf(cell) / cols);
        const col = Array.from(simulationArea.children).indexOf(cell) % cols;
        const cellData = cells[row][col];
        
        let tooltipText = `Base Pathloss: ${cellData.basePathloss.toFixed(2)}`;
        if (cellData.shadows && cellData.shadows.length > 0) {
            tooltipText += `\nShadows: ${cellData.shadows.length}`;
            tooltipText += `\nShadow Attenuation: ${(cellData.currentPathloss - cellData.basePathloss).toFixed(2)}`;
        }
        tooltipText += `\nTotal Pathloss: ${cellData.currentPathloss.toFixed(2)}`;
        
        tooltip.textContent = tooltipText;
        tooltip.style.whiteSpace = "pre-line";
    }

    // Enhanced tooltip display with shadow information
    simulationArea.addEventListener("mousemove", (e) => {
        const cell = e.target;
        if (cell && cell.classList.contains("cell")) {
            updateTooltip(cell);
            tooltip.style.left = `${e.pageX + 10}px`; // Offset to avoid cursor overlap
            tooltip.style.top = `${e.pageY + 10}px`; // Offset to avoid cursor overlap
            tooltip.style.display = "block";
        } else {
            tooltip.style.display = "none";
        }
    });

    simulationArea.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
    });

}
