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


function initializeTask3Simulation(){
    const kInput = document.getElementById('k_val');
    const gammaInput = document.getElementById('gamma_val');
    const d0Input = document.getElementById('d0_val');
    const densityInput = document.getElementById('obstacle_density_val');
    const distanceSlider = document.getElementById('current_distance_slider');
    const distanceDisplay = document.getElementById('current_distance_val');
    const angleSlider = document.getElementById('receiver_angle_slider');
    const angleDisplay = document.getElementById('receiver_angle_val');
    const randomizeBtn = document.getElementById('randomize_obstacles_btn');
    const recordBtn = document.getElementById('record_data_btn');
    const generateGraphBtn = document.getElementById('generate_graph_btn');
    const resetBtn = document.getElementById('reset_session_btn');
    const autoGenerateBtn = document.getElementById('auto_generate_btn');
    const recordCountDisplay = document.getElementById('record_count_display');

    const simCanvas = document.getElementById('simulationCanvas');
    const simCtx = simCanvas.getContext('2d');
    const graphCanvas = document.getElementById('pathlossGraph');
    const graphPlaceholder = document.getElementById('graph_placeholder');

    const outStatus = document.getElementById('out_status');
    const statusIndicator = document.getElementById('status_indicator');
    const outTotalPl = document.getElementById('out_total_pl_val');
    const outPrPt = document.getElementById('out_pr_pt_val');

    let pathlossChart;
    let obstacles = [];
    let currentK, currentGamma, currentD0, currentRxDistance_km, currentRxAngleRad;
    let recordedData = [];
    const MIN_RECORDINGS = 10;
    const MAX_RECORDINGS = 50;

    // Simulation Constants
    const canvasWidth = simCanvas.width;
    const canvasHeight = simCanvas.height;
    const txPos_px = { x: canvasWidth / 2, y: canvasHeight / 2 };
    const maxCanvasDisplayRadius_px = Math.min(canvasWidth, canvasHeight) / 2 * 0.85;
    let worldScale_pxPerKm;

    const TX_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY2N2VlYSI+PHBhdGggZD0iTTEyIDNsNCA0aC0zdjEwaC0yVjdIOFs0LTR6TTQgOWgzdjJINGMtMnptMCA0aDN2Mkg0di0yem0xNi00aC0zdjJoM3YtMnptMCA0aC0zdjJoM3YtMnoiLz48L3N2Zz4=';
    const RX_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY2N2VlYSI+PHBhdGggZD0iTTE2IDFIOEM2LjM0IDEgNSAyLjM0IDUgNHYxNmMwIDEuNjYgMS4zNCAzIDMgM2g4YzEuNjYgMCAzLTEuMzQgMy0zVjRjMC0xLjY2LTEuMzQtMy0zLTN6TTE0IDIxaC00di0xaDR2MXptMS4yNS0zSDguNzVWNGg2LjV2MTR6Ii8+PC9zdmc+';
    
    let txImage, rxImage;
    const TX_IMG_SIZE = 48;
    const RX_IMG_SIZE = 28;

    function loadImages() {
        return new Promise((resolve) => {
            txImage = new Image();
            rxImage = new Image();
            let loadedCount = 0;
            
            const onImageLoad = () => {
                loadedCount++;
                if (loadedCount === 2) {
                    resolve();
                }
            };
            
            txImage.onload = onImageLoad;
            rxImage.onload = onImageLoad;
            
            txImage.onerror = onImageLoad;
            rxImage.onerror = onImageLoad;
            
            txImage.src = TX_ICON;
            rxImage.src = RX_ICON;
        });
    }

    async function init() {
        await loadImages();
        setupEventListeners();
        initializeChart();
        readAllInputs();
        calculateWorldScale();
        placeObstacles();
        updateSimulation();
        updateUIState();
    }

    function setupEventListeners() {
        [kInput, gammaInput, d0Input, distanceSlider, angleSlider].forEach(el => {
            el.addEventListener('input', () => { readAllInputs(); updateSimulation(); });
        });

        densityInput.addEventListener('input', () => {
            readAllInputs();
            placeObstacles();
            updateSimulation();
        });

        randomizeBtn.addEventListener('click', () => {
            placeObstacles();
            updateSimulation();
        });

        recordBtn.addEventListener('click', recordDataPoint);
        generateGraphBtn.addEventListener('click', generateGraph);
        resetBtn.addEventListener('click', resetSession);
        autoGenerateBtn.addEventListener('click', autoGenerateData);
    }
    
    function readAllInputs() {
        currentK = parseFloat(kInput.value);
        currentGamma = parseFloat(gammaInput.value);
        currentD0 = parseFloat(d0Input.value);
        currentRxDistance_km = parseFloat(distanceSlider.value);
        distanceDisplay.textContent = currentRxDistance_km.toFixed(2);
        currentRxAngleRad = parseFloat(angleSlider.value) * Math.PI / 180;
        angleDisplay.textContent = (currentRxAngleRad * 180 / Math.PI).toFixed(0);
    }
    
    function updateUIState() {
        recordCountDisplay.textContent = `${recordedData.length} / ${MAX_RECORDINGS}`;
        recordBtn.disabled = recordedData.length >= MAX_RECORDINGS;
        autoGenerateBtn.disabled = recordedData.length >= MAX_RECORDINGS;
        generateGraphBtn.disabled = recordedData.length < MIN_RECORDINGS;
    }
    
    function recordDataPoint() {
        if (recordedData.length >= MAX_RECORDINGS) return;
        readAllInputs();
        const { prPtDb } = calculateCurrentSignal();
        recordedData.push({ x: currentRxDistance_km, y: prPtDb });
        updateUIState();
    }
    
    function autoGenerateData() {
        const NUM_AUTO_POINTS = 50;
        const min_dist = parseFloat(distanceSlider.min);
        const max_dist = parseFloat(distanceSlider.max);
        
        recordedData = [];

        for (let i = 0; i < NUM_AUTO_POINTS; i++) {
            if (recordedData.length >= MAX_RECORDINGS) break;

            const randomDist_km = Math.random() * (max_dist - min_dist) + min_dist;
            const randomAngle_rad = Math.random() * 2 * Math.PI;

            const { prPtDb } = calculateSignalAtPoint(randomDist_km, randomAngle_rad);
            recordedData.push({ x: randomDist_km, y: prPtDb });
        }
        
        updateUIState();
        if (recordedData.length >= MIN_RECORDINGS) {
            generateGraph();
        }
    }

    function generateGraph() {
        if (recordedData.length < MIN_RECORDINGS) return;
        
        graphPlaceholder.style.display = 'none';
        graphCanvas.style.display = 'block';

        // --- CHANGE: DYNAMIC FLOOR CALCULATION ---
        // 1. Find the minimum Pr/Pt value (most negative) from the recorded data.
        const minPrPt = Math.min(...recordedData.map(p => p.y));

        // 2. Calculate the floor by rounding this minimum value down to the next multiple of 20.
        //    (e.g., -153 becomes -160, -161 becomes -180).
        //    A fallback to -180 is used if data is empty or invalid.
        const yAxisFloor = isFinite(minPrPt) ? Math.floor(minPrPt / 20) * 20 : -180;

        // 3. Create a new dataset where values are "clamped" or "capped" at the calculated floor.
        const cappedData = recordedData.map(point => ({
            x: point.x,
            y: Math.max(point.y, yAxisFloor)
        }));
        const sortedCappedData = [...cappedData].sort((a, b) => a.x - b.x);
        
        // Update the chart with the capped data.
        pathlossChart.data.datasets[1].data = sortedCappedData;

        // Update the ideal pathloss line (this is not capped).
        const meanPrPtData = [];
        const minD = parseFloat(distanceSlider.min);
        const maxD = parseFloat(distanceSlider.max);
        for (let dist = minD; dist <= maxD; dist += 0.1) {
            const meanPl = calculateMeanPathloss(dist, currentK, currentGamma, currentD0);
            meanPrPtData.push({ x: dist, y: -meanPl });
        }
        pathlossChart.data.datasets[0].data = meanPrPtData;
        
        // 4. Update the y-axis of the chart to use the new dynamic floor.
        pathlossChart.options.scales.y.min = yAxisFloor;
        pathlossChart.options.scales.y.max = -40; // Keep a fixed ceiling for consistency.

        pathlossChart.update();
    }
    
    function resetSession() {
        recordedData = [];
        if (pathlossChart) {
            pathlossChart.data.datasets[1].data = [];
            pathlossChart.data.datasets[0].data = [];
            // Reset y-axis to default
            pathlossChart.options.scales.y.min = -180;
            pathlossChart.options.scales.y.max = -40;
            pathlossChart.update();
        }
        graphPlaceholder.style.display = 'flex';
        graphCanvas.style.display = 'none';
        updateUIState();
        placeObstacles();
        updateSimulation();
    }
    
    function calculateSignalAtPoint(distance_km, angle_rad) {
        const rxRadius_px = distance_km * worldScale_pxPerKm;
        const rxPos_px = {
            x: txPos_px.x + rxRadius_px * Math.cos(angle_rad),
            y: txPos_px.y + rxRadius_px * Math.sin(angle_rad)
        };
        const meanPlDb = calculateMeanPathloss(distance_km, currentK, currentGamma, currentD0);
        const { shadowingDb, isOccluded } = calculateShadowingAtPosition(rxPos_px);
        
        // CHANGE: The hardcoded pathloss cap has been removed from this function.
        // It now returns the "true" calculated pathloss, and the capping is
        // handled visually in the generateGraph() function.
        const totalPlDb = meanPlDb + shadowingDb;

        const prPtDb = -totalPlDb;
        return { totalPlDb, prPtDb, isOccluded };
    }

    function calculateCurrentSignal() {
        return calculateSignalAtPoint(currentRxDistance_km, currentRxAngleRad);
    }

    function updateSimulation() {
        const { totalPlDb, prPtDb, isOccluded } = calculateCurrentSignal();
        outTotalPl.textContent = totalPlDb.toFixed(2);
        outPrPt.textContent = prPtDb.toFixed(2);
        outStatus.textContent = isOccluded ? "Occluded" : "Line of Sight";
        statusIndicator.className = `status-indicator ${isOccluded ? 'status-occluded' : 'status-los'}`;
        
        const currentRxRadius_px = currentRxDistance_km * worldScale_pxPerKm;
        const rxPos_px = {
            x: txPos_px.x + currentRxRadius_px * Math.cos(currentRxAngleRad),
            y: txPos_px.y + currentRxRadius_px * Math.sin(currentRxAngleRad)
        };
        drawSimulationCanvas(rxPos_px, currentRxRadius_px, isOccluded);
    }
    
    function initializeChart() {
        pathlossChart = new Chart(graphCanvas, {
            type: 'scatter',
            data: {
                datasets: [
                    { 
                        label: 'Ideal Pathloss (No Fading)', data: [], borderColor: '#3498db',
                        borderDash: [8, 4], type: 'line', fill: false, pointRadius: 0, borderWidth: 3,
                    },
                    {
                        label: 'Recorded Pr/Pt (with Fading)', 
                        data: [], 
                        borderColor: '#e74c3c', 
                        backgroundColor: '#e74c3c', 
                        pointRadius: 4,
                        borderWidth: 2,
                        showLine: false,
                        type: 'line' 
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 20
                },
                plugins: { legend: { labels: { usePointStyle: true, font: { size: 12 } } } },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Distance (km)', font: { size: 16, weight: '600' } },
                        min: 0, 
                        max: 5
                    },
                    y: { 
                        title: { display: true, text: 'Pr/Pt (dB)', font: { size: 16, weight: '600' } },
                        // Default min/max, will be updated dynamically by generateGraph()
                        max: -40,
                        min: -180,
                    }
                }
            }
        });
    }        

    function poissonRandom(lambda) {
        let L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        return k - 1;
    }

    let spareRandom = null;
    function gaussianRandom(mean, stdDev) {
        let val, u, v, s;
        if (spareRandom !== null) {
            val = spareRandom;
            spareRandom = null;
        } else {
            do {
                u = Math.random() * 2 - 1;
                v = Math.random() * 2 - 1;
                s = u * u + v * v;
            } while (s >= 1 || s === 0);
            s = Math.sqrt(-2.0 * Math.log(s) / s);
            val = u * s;
            spareRandom = v * s;
        }
        return mean + stdDev * val;
    }

    function calculateWorldScale() { 
        worldScale_pxPerKm = maxCanvasDisplayRadius_px / parseFloat(distanceSlider.max); 
    }
    
    function placeObstacles() {
        obstacles = [];
        const densityPerKm2 = parseFloat(densityInput.value); 
        const maxSimDistance_km = parseFloat(distanceSlider.max);
        const areaKm2 = Math.PI * Math.pow(maxSimDistance_km, 2);
        const lambda = densityPerKm2 * areaKm2;
        const numObs = poissonRandom(lambda);
        
        for (let i = 0; i < numObs; i++) {
            const obsDistFromTx_km = Math.sqrt(Math.random()) * maxSimDistance_km; 
            const obsAngleRad = Math.random() * 2 * Math.PI;
            const obsRadius_km = (Math.random() * 8 * 0.6 + 8 * 0.2) / 1000; 
            const obsX_km = obsDistFromTx_km * Math.cos(obsAngleRad);
            const obsY_km = obsDistFromTx_km * Math.sin(obsAngleRad); 
            const attenuation = Math.max(0.5, 8 + (Math.random() - 0.5) * 2 * 5);
            obstacles.push({
                x_km: obsX_km, y_km: obsY_km, radius_km: obsRadius_km, attenuationDb: attenuation,
                x_px: txPos_px.x + obsX_km * worldScale_pxPerKm, y_px: txPos_px.y + obsY_km * worldScale_pxPerKm,
                radius_px: Math.max(2, obsRadius_km * worldScale_pxPerKm), 
                color: `hsl(${30 + (attenuation / 20) * 30}, 70%, ${60 - (attenuation / 20) * 20}%)`
            });
        }
    }

    function calculateShadowingAtPosition(rxPos_px) {
        let fadingEffectDb = 0;
        let occluded = false;
        const FADING_VARIANCE = 15;
        const FADING_STD_DEV = Math.sqrt(FADING_VARIANCE);

        fadingEffectDb += gaussianRandom(0, 2); 

        for (const obs of obstacles) {
            const obsCenter_px = { x: obs.x_px, y: obs.y_px };
            if (isLineSegmentIntersectingCircle(txPos_px, rxPos_px, obsCenter_px, obs.radius_px ** 2)) {
                occluded = true;
                fadingEffectDb += gaussianRandom(0, FADING_STD_DEV);
            }
        }
        
        return { shadowingDb: fadingEffectDb, isOccluded: occluded };
    }

    function calculateMeanPathloss(distance, K, gamma, d0) {
        if (distance <= 0) distance = 0.0001; if (d0 <= 0) d0 = 0.0001;
        return (distance < d0) ? K : K + 10 * gamma * Math.log10(distance / d0);
    }

    function isLineSegmentIntersectingCircle(P1, P2, C, R_sq) {
        let dX = P2.x - P1.x; let dY = P2.y - P1.y; if ((dX === 0) && (dY === 0)) return false;
        let t = ((C.x - P1.x) * dX + (C.y - P1.y) * dY) / (dX * dX + dY * dY); t = Math.max(0, Math.min(1, t));
        let closestX = P1.x + t * dX; let closestY = P1.y + t * dY;
        return ((C.x - closestX) ** 2 + (C.y - closestY) ** 2) <= R_sq;
    }
    
    function drawSimulationCanvas(rxPos_px, currentRxRadius_px, isOccluded) {
        simCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        simCtx.strokeStyle = 'rgba(74, 105, 189, 0.3)'; simCtx.lineWidth = 1; simCtx.setLineDash([3, 3]);
        for (let i = 1; i <= 5; i += 1) {
            const r = i * worldScale_pxPerKm; 
            simCtx.beginPath(); 
            simCtx.arc(txPos_px.x, txPos_px.y, r, 0, 2 * Math.PI); 
            simCtx.stroke();
        }
        
        simCtx.setLineDash([]); simCtx.beginPath(); simCtx.arc(txPos_px.x, txPos_px.y, currentRxRadius_px, 0, 2 * Math.PI);
        simCtx.strokeStyle = isOccluded ? 'rgba(255, 87, 34, 0.8)' : 'rgba(76, 175, 80, 0.8)'; simCtx.lineWidth = 2; simCtx.setLineDash([5, 5]); simCtx.stroke(); simCtx.setLineDash([]);
        
        obstacles.forEach(obs => {
            simCtx.fillStyle = obs.color; simCtx.fillRect(obs.x_px - obs.radius_px, obs.y_px - obs.radius_px, obs.radius_px * 2, obs.radius_px * 2);
        });

        if(txImage && txImage.complete) {
            simCtx.drawImage(txImage, txPos_px.x - TX_IMG_SIZE / 2, txPos_px.y - TX_IMG_SIZE / 2, TX_IMG_SIZE, TX_IMG_SIZE);
        }

        if(rxImage && rxImage.complete) {
            simCtx.drawImage(rxImage, rxPos_px.x - RX_IMG_SIZE / 2, rxPos_px.y - RX_IMG_SIZE / 2, RX_IMG_SIZE, RX_IMG_SIZE);
        }
        
        simCtx.beginPath(); 
        simCtx.moveTo(txPos_px.x, txPos_px.y); 
        simCtx.lineTo(rxPos_px.x, rxPos_px.y);
        simCtx.strokeStyle = isOccluded ? '#ff5722' : '#4caf50'; 
        simCtx.lineWidth = 3; 
        simCtx.stroke();
    }

    document.addEventListener('DOMContentLoaded', init);
}