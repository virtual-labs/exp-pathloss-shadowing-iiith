//Your JavaScript goes in here
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
//   const x=3*1e4;
//     console.log(x);
function getOutput(){
    const G = parseFloat(document.getElementById("G").value);
    const d = parseFloat(document.getElementById("d").value);
    const hr = parseFloat(document.getElementById("hr").value);
    const ht = parseFloat(document.getElementById("ht").value);
    const fc = parseFloat(document.getElementById("fc").value);
    const fc_Hz = fc*1000000;
    const c = 3 * 1e8;
  
    const lamda = c / fc_Hz;
    const dc = (4 * ht * hr) / lamda;
    let path_loss;
    if(d<dc){
        path_loss=20*(Math.log10(4*Math.PI)+Math.log10(d)-log10(lamda)-(Math.log(G)*1/2));
    }else{
        path_loss=20*(2*Math.log10(d)-Math.log10(hr)-Math.log10(ht)-(Math.log(G)*1/2));
    }
    const pathl = path_loss;

    document.getElementById("observations").innerHTML = `
        <p><strong>Path Loss (dB):</strong> ${pathl.toFixed(2)} dB</p>
    `;
}

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


function getOutput3() {
     document.getElementById("observations3").innerHTML = `
        <p><strong>d:</strong> ${d.toFixed(2)}</p>
        <p><strong>m:</strong> ${m.toFixed(2)}</p>
    `;
}