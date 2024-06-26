"use strict";
class Field {
    constructor(element, x, y) {
        this.element = element;
        this.x = x;
        this.y = y;
        this.ship = null;
        this.hit = false;
    }
}

class Ship {
    constructor(element, length, name) {
        this.element = element;
        this.length = length;
        this.orientation = "horizontal";
        this.name = name;
        this.hit = false;
        this.sunk = false;
    }
}

class TurnManager {
    constructor() {
        this._myTurn = true;
    }

    get myTurn() {
        return this._myTurn;
    }

    set myTurn(value) {
        this._myTurn = value;
        if (!this._myTurn) {
            console.log("enemy turn getAttacked");
            getAttacked();
        }
    }
}

const ownFleetOfShips= [new Ship(document.createElement("div"), 1, "S1"),
    new Ship(document.createElement("div"), 2, " S2"),
    new Ship(document.createElement("div"), 3, " S3"),
    new Ship(document.createElement("div"), 4, "S4"),
    new Ship(document.createElement("div"), 5, " S5")];
const enemyFleetOfShips = [new Ship(document.createElement("div"), 1, "S1"),
    new Ship(document.createElement("div"), 2, " S2"),
    new Ship(document.createElement("div"), 3, " S3"),
    new Ship(document.createElement("div"), 4, "S4"),
    new Ship(document.createElement("div"), 5, " S5")];

let defenseFields = [];
let attackFields = [];

let lastHitX, lastHitY;
let lastHitOn;
let lastHitSuccess;
let lastHitShip = null;

const defenseBoard = document.getElementById("defense-board");
const attackBoard = document.getElementById("attack-board");

const base = document.getElementById("shipbase");

let winScore = 0;
let started = false;
let turnManager = new TurnManager();
let defenseScore = 0;
let attackScore = 0;

document.addEventListener('DOMContentLoaded', () => {
    updateGame();

    initializeDefenseBoard();
    initializeAttackBoard();

    initializeShips();
    initializeEnemyShips();
});

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop < 100) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});

function calculateWinScore(){
    winScore = 0;
    for (let ship of enemyFleetOfShips) {
        winScore += ship.length;
    }
}

function fixShips(){
    for(let ship of ownFleetOfShips){
        ship.element.setAttribute("draggable", "false");
    }
}

function updateGame(){
    calculateWinScore();
    calculateWinScore();
    updateProgressBar();
    showPopover(checkGameOver());
}

function startGame(){
    fixShips();
    console.log("start game");
    started = true;
}

function checkGameOver(){
    if (defenseScore == winScore){
        return 1;
    }else if (attackScore == winScore){
        return -1;
    }
    return 0;
}

function initializeDefenseBoard(){
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            console.log("start initializing field:", i, j);
            defenseFields.push(new Field(document.createElement("div"), i, j));
            console.log("finished initializing defense field:", defenseFields[i * 10 + j]);
        }
    }

    for(let field of defenseFields) {
        field.element.classList.add("field");
        //field.element.innerHTML = field.x + " " + field.y;
        defenseBoard.appendChild(field.element);
    }
}

function initializeAttackBoard(){
    console.log("start initializing attack board");
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            console.log("start initializing field:", i, j);
            attackFields.push(new Field(document.createElement("div"), i, j));
            console.log("finished initializing attack field:", attackFields[i * 10 + j]);
        }
    }

    for(let field of attackFields) {
        field.element.classList.add("field");
        field.element.addEventListener("mousedown", function (event) {
            event.preventDefault();
            if (turnManager.myTurn){
                if (!attack(field.x, field.y, attackFields)){
                    turnManager.myTurn = false;
                }else {
                    defenseScore++;
                }
            }
        })
        //field.element.innerHTML = field.x + " " + field.y;
        attackBoard.appendChild(field.element);
    }
}

function restartGame(){
    location.replace(location.href);
}

function logGame(){
    for (let field of attackFields) {
        console.log("attack board:", field, field.ship);
    }
    for (let field of defenseFields) {
        console.log("defense board", field, field.ship);
    }
    for (let ship of ownFleetOfShips) {
        console.log("base fleet board", ship);
    }
}

function initializeEnemyShips(){
    console.log("enemyFleet:", enemyFleetOfShips);
    let  loopProtection = 0;
    console.log("start initializing enemy ships");
    for (let ship of enemyFleetOfShips) {
        console.log("start initialized enemy ship: ", ship);
        let x, y, selectedField;
        console.log("try on field:", selectedField);
        do {
            x = getRandomInt(10);
            y = getRandomInt(10);
            selectedField = attackFields[y * 10 + x];
            loopProtection++;
            if (loopProtection > 1000){
                console.log("loop protection");
                break;
            }
        } while (!placeShip(selectedField, ship, attackFields, true));
        console.log("ENEMY!!!!!! finished initialized ship: ", ship, "on the field:", selectedField);
    }
    console.log("finished initializing enemy ships");
}

function initializeShips(){
    for(let ship of ownFleetOfShips){
        console.log("start initialized ship: ", ship);
        ship.element.classList.add("ship");
        ship.element.classList.add("ship-color-default");
        ship.element.setAttribute("draggable", "true");
        ship.element.style.width = ship.length * 60 + "px";
        ship.element.innerHTML = ship.name;
        base.appendChild(ship.element);

        ship.element.addEventListener("dragstart", function (event){
            console.log("start dragging:", ship);
            let selectedShip = ship;
            for (let field of defenseFields) {

                field.element.addEventListener("dragover", function (event){
                    event.preventDefault();
                })

                field.element.addEventListener("drop", function (event){
                    console.log("try placing:",selectedShip, "on the field:", field);
                    placeShip(field, selectedShip, defenseFields, true);
                    console.log("successfully placed:",selectedShip, "on the field:", field);
                    selectedShip = null;
                })
            }
        })
        console.log("finished initialized ship: ", ship);
    }
}


function checkSpaces(ship, x, y, fields) {
    let size = ship.length;
    console.log("start checking spaces", size, x, y);

    if (y + size > 10) {
        console.log("out of bounds");
        return false;
    }

    let startX = x - 1 < 0 ? 0 : x - 1;
    let startY = y - 1 < 0 ? 0 : y - 1;

    let endX = x + 1 > 9 ? 9 : x + 1;
    let endY = y + size > 10 ? 10 : y + size + 1;

    for (let i = startX; i <= endX; i++) {
        for (let j = startY; j <= endY; j++) {
            if (fields[i * 10 + j].ship != null) {
                if (fields[i * 10 + j].ship !== ship) {
                    return false;
                }
            }
        }
    }
    return true;
}

function removeShip(ship, fields){
    console.log("start removing ship", ship);
    let i = 0;
    for (let field of fields){
        if (field.ship == ship){
            field.ship = null;
            field.element.classList.remove("ship-body");
            field.element.classList.remove("ship-end");
            field.element.classList.remove("ship-color-default");
            field.element.classList.add("field");
            console.log("succesfully removed ship", ship, "from fields:", field);
            i++;
        }
    }
    if (i != ship.length){
        console.log("ship not found in fields");
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getAttacked() {
    console.log("getting attacked");
    let x, y;

    if (lastHitShip != null && !isSunk(lastHitShip)) {
        console.log("smart attack");
        if (lastHitOn === "+") {
            if (lastHitY + 1 < 10 && !defenseFields[lastHitX * 10 + (lastHitY + 1)].hit) {
                if (attack(lastHitX, lastHitY + 1, defenseFields)) {
                    console.log("smart hit on", lastHitY + 1);
                    lastHitY += 1;
                    lastHitOn = "+";
                    attackScore++;
                    return getAttacked();
                }else {
                    lastHitOn = "-";
                }
            }
        } else if (lastHitOn === "-") {
            if (lastHitY - 1 >= 0 && !defenseFields[lastHitX * 10 + (lastHitY - 1)].hit) {
                if (attack(lastHitX, lastHitY - 1, defenseFields)) {
                    console.log("smart hit on", lastHitY - 1);
                    lastHitY -= 1;
                    lastHitOn = "-";
                    attackScore++;
                    return getAttacked();
                }else {
                    lastHitOn = "+";
                }
            }
        }
        lastHitShip = null;
        return getAttacked();
    } else {
        do {
            x = getRandomInt(10);
            y = getRandomInt(10);
        } while (defenseFields[x * 10 + y].hit);

        console.log("attacking at", x, y);
        if (attack(x, y, defenseFields)) {
            console.log("hit at", x, y);
            lastHitX = x;
            lastHitY = y;
            lastHitShip = defenseFields[x * 10 + y].ship;
            attackScore++;
            lastHitOn = "+";
            getAttacked();
        }
    }
    turnManager.myTurn = true;
    updateGame();
}

function attack(x, y, fields){
    let field = fields[x * 10 + y];
    if (started){
        if (!field.hit) {
            field.hit = true;
            if (field.ship != null) {
                console.log("hit");
                field.ship.hit = true;
                field.ship.sunk = isSunk(field.ship);
                field.element.classList.add("ship-color-hit");
                field.element.classList.remove("ship-color-default");
                updateGame();
                return true;
            } else {
                console.log("miss");
                field.element.style.backgroundColor = "blue";
                updateGame();
                return false;
            }
        }
    }
}

function placeShip( field, selectedShip, fields, visible){
    console.log("!INFUNCTION trying to place:", selectedShip, "on the field:", field);

    if (field.ship === null && checkSpaces(selectedShip, field.x, field.y, fields)){
        console.log("field is ready for placement")
        removeShip(selectedShip, fields);
        console.log(selectedShip.element);
        field.element.appendChild(selectedShip.element);
        let counter = 1;
        for (let i = field.y; i < field.y + selectedShip.length; i++) {
            let currentField = fields[field.x * 10 + i];
            currentField.ship = selectedShip;
            if (visible & selectedShip.length > 1){
                if (counter == selectedShip.length){
                    currentField.element.classList.add("ship-end");
                } else if (counter == 1){
                    currentField.element.classList.add("ship-color-default");
                    currentField.element.classList.add("ship-start");
                } else {
                    currentField.element.classList.add("ship-color-default");
                    currentField.element.classList.add("ship-body");
                };
                currentField.element.classList.remove("field");
            }
            counter++;
        }
        field.ship = selectedShip;
    }
}

function placeShipRandom(){
    for (let ship of ownFleetOfShips){
        removeShip(ship, defenseFields);
    }

    if (!started){
        for (let ship of ownFleetOfShips) {
            let x = getRandomInt(10);
            let y = getRandomInt(10);
            let field = defenseFields[x * 10 + y];
            console.log("start random placing ship:", ship, "on the field:", field);
            while (!checkSpaces(ship, x, y, defenseFields)) {
                x = getRandomInt(10);
                y = getRandomInt(10);
                field = defenseFields[x * 10 + y];
            }
            placeShip(field, ship, defenseFields, true);
        }
    }else {
        console.log("game already started");
    }
}

function updateProgressBar() {
    const progressBarEnemy = document.getElementById('progressBarEnemy');
    progressBarEnemy.style.width = ((defenseScore / winScore) * 100) + '%';
    progressBarEnemy.textContent = defenseScore + "/" + winScore;
    const progressBarYou = document.getElementById('progressBarYou');
    progressBarYou.style.width = ((attackScore / winScore) * 100) + '%';
    progressBarYou.textContent = attackScore + "/" + winScore
}

function isSunk(ship){
    for (let field of defenseFields){
        if (field.ship == ship && !field.hit){
            return false;
        }
    }
    ship.element.style.backgroundColor = "red";
    ship.element.style.zIndex = 2001;
    return true;
}

function showPopover(value) {
    const popover = document.getElementById('popover');

    switch(value) {
        case 1:
            popover.innerText = 'You won!';
            break;
        case -1:
            popover.innerText = 'You lost!';
            break;
        default:
            popover.innerText = '';
            popover.style.display = 'none';
            return;
    }
    popover.style.display = 'block';
}