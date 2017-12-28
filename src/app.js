var d3 = require("d3");
var functionPlot = require('function-plot');

window.d3 = d3;

var synced = {};

var chartWidth = 800;
var chartHeight = 800;
var chartInst = null;
function sync(key, input, number = false) {
    Object.defineProperty(synced, key, {
        get() {
            return number ? parseFloat(input.value) : input.value;
        },
        set(val) {
            input.value = val;
        }
    })
}

function computeYScale(width, height, xScale) {
    var xDiff = xScale[1] - xScale[0]
    var yDiff = height * xDiff / width
    return [-yDiff / 2, yDiff / 2]
}


var last = null;

function buildChart() {
    //console.log("a = " + synced.leftWing.toString());
    var leftStart = center() - Math.max(Math.abs(synced.leftWing), Math.abs(synced.rightWing));
    var rightStart = center() + Math.max(Math.abs(synced.leftWing), Math.abs(synced.rightWing));
    if (!last) {
        last = {
            xDomain: [leftStart * 1.1, rightStart * 1.1],
        };
        last.yDomain = computeYScale(chartWidth, chartHeight, last.xDomain);
    }
    chartInst = window.inst = functionPlot({
        width: chartWidth,
        height: chartHeight,
        target: '.chart',
        data: [{
            fn: synced.equation,
            color: "#3e4cb6"
        }],
        xAxis: { domain: last.xDomain },
        yAxis: { domain: last.yDomain },
        annotations: [
            {
                x: synced.leftWing,
                text: "a"
            },
            {
                x: synced.rightWing,
                text: "b"
            },
            {
                x: center(),
                text: "x"
            }
        ],
        plugins: [
            functionPlot.plugins.zoomBox()
        ]
    });
    last = {
        xDomain: [leftStart * 1.1, rightStart * 1.1],
    };
    last.yDomain = computeYScale(chartWidth, chartHeight, last.xDomain);
    chartInst.programmaticZoom(last.xDomain, last.yDomain);
}

function computeEquation(x) {
    return functionPlot.eval.builtIn({ fn: synced.equation }, 'fn', { x })
}
function center() {
    return (synced.rightWing + synced.leftWing) / 2;
}
function doStep() {

    if (computeEquation(center()) < 0) {
        synced.leftWing = center();
    } else {
        synced.rightWing = center();
    }
    //xInput.value = center();
    return center();
    // if(computeEquation)
}


window.addEventListener("load", _ => {
    var equationInput = document.querySelector(".input-equation");
    var leftWingInput = document.querySelector(".input-left-wing");
    var rightWingInput = document.querySelector(".input-right-wing");
    var xInput = document.querySelector(".input-x");
    var doStepButton = document.querySelector(".do-step");
    var preciseButton = document.querySelector(".compute-precise");
    var editEquationInput = document.querySelector(".input-edit-equation");
    var equationError = document.querySelector(".equation-error");
    var equationEditForm = document.querySelector(".equation-edit-form");
    var changeEquationButton = document.querySelector(".change-equation");
    var selectEquationButton = document.querySelector(".select-equation");
    var selectEquationModal = document.querySelector(".change-equation-modal");
    var modalOverlay = document.querySelector(".change-equation-modal > .modal-overlay");
    var modalXButton = document.querySelector(".change-equation-modal .btn-clear");
    var chartColumn = document.querySelector(".chart-column");
    var doit;

    sync("equation", equationInput);
    sync("leftWing", leftWingInput, true);
    sync("rightWing", rightWingInput, true);
    //buildChart();
    equationInput.addEventListener("keyup", _ => {
        buildChart();
    });
    leftWingInput.addEventListener("keyup", _ => {
        buildChart();
    });
    rightWingInput.addEventListener("keyup", _ => {
        buildChart();
    });
    editEquationInput.addEventListener("keyup", _ => {
        try {
            functionPlot.eval.builtIn({ fn: editEquationInput.value }, 'fn', { x: 0 });
            equationError.innerHTML = "";
            equationEditForm.classList.remove("has-danger");
            changeEquationButton.disabled = false;
        } catch (e) {
            equationError.innerHTML = "Ta funkcja nie jest poprawna.";
            equationEditForm.classList.add("has-danger");
            changeEquationButton.disabled = true;
        }
    });
    doStepButton.addEventListener("click", _ => {
        xInput.value = doStep();
        buildChart();
    });
    changeEquationButton.addEventListener("click", _ => {
        equationInput.value = editEquationInput.value;
        selectEquationModal.classList.remove("active");
        leftWingInput.value = -10000;
        rightWingInput.value = 10000;
        xInput.value = "";
        buildChart();
    });
    modalOverlay.addEventListener("click", _ => {
        selectEquationModal.classList.remove("active");
    });
    modalXButton.addEventListener("click", _ => {
        selectEquationModal.classList.remove("active");
    });
    selectEquationButton.addEventListener("click", _ => {
        selectEquationModal.classList.add("active");
    });
    preciseButton.addEventListener("click", _ => {
        var lastVal = null;
        var limitCounter = 9999;
        while (true) {
            limitCounter--;
            var currVal = doStep();
            if (limitCounter < 0 || lastVal == currVal) break;
            lastVal = currVal;
        }
        xInput.value = currVal;
        buildChart();
    });


    chartHeight = chartColumn.clientHeight - 40;
    chartWidth = chartColumn.clientWidth - 40;
    buildChart();
    window.addEventListener("resize", _ => {
        clearTimeout(doit);
        doit = setTimeout(_ => {
            chartHeight = chartColumn.clientHeight - 40;
            chartWidth = chartColumn.clientWidth - 40;
            buildChart();
        }, 100);
    });
});