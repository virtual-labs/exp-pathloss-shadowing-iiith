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

//______________________________________________________________________________________________________________________________

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

// Initial Setup
updatePathLoss();









// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~task_2~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function getOutput2() {
    const G = parseFloat(document.getElementById("G1").value);
    const hr = parseFloat(document.getElementById("hr1").value);
    const ht = parseFloat(document.getElementById("ht1").value);
    const f= parseFloat(document.getElementById("fc1").value);
    const fc = f*1000000;

    const fc_Hz = fc;
    const c = 3 * 1e8;
    const lambda = c / fc_Hz;
    const dc = (4 * ht * hr) / lambda;

    const distances = [];
    const path_losses = [];

    for (let d = 0.1; d <= 2; d += 0.1) {
        distances.push(d.toFixed(1));
        let path_loss;
        if (d * 1000 < dc) {
            path_loss = 20 * (Math.log10(4 * Math.PI) + Math.log10(d * 1000) - Math.log10(lambda) - (Math.log(G) * 1 / 2));
        } else {
            path_loss = 20 * (2 * Math.log10(d * 1000) - Math.log10(hr) - Math.log10(ht) - (Math.log(G) * 1 / 2));
        }
        path_losses.push(path_loss.toFixed(2));
    }

    document.getElementById("observations2").innerHTML = `
        <canvas id="pathLossChart"></canvas>
    `;
    const canvas = document.getElementById('pathLossChart');
    canvas.width = 700;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Path Loss (dB)',
                data: path_losses,
                borderColor: 'black',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: 'black',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(0, 0, 0, 1)',
                        font: {
                            size: 14,
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Path Loss vs Distance',
                    color: 'rgba(0, 0, 0, 1)',
                    font: {
                        size: 18,
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Distance (km)',
                        color: 'rgba(0, 0, 0, 1)',
                        font: {
                            size: 16,
                        }
                    },
                    ticks: {
                        color: 'rgba(0, 0, 0, 1)',
                        font: {
                            size: 12,
                        }
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.3)',
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Path Loss (dB)',
                        color: 'rgba(0, 0, 0, 1)',
                        font: {
                            size: 16,
                        }
                    },
                    ticks: {
                        color: 'rgba(0, 0, 0, 1)',
                        font: {
                            size: 12,
                        }
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.3)',
                    }
                }
            }
        }
    });
}



function getOutput3(){
     document.getElementById("observations3").innerHTML = `
        <p><strong>d:</strong> ${d.toFixed(2)}</p>
        <p><strong>m:</strong> ${m.toFixed(2)}</p>
    `;

}
