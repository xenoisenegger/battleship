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
const enemyFleetOfShips = [new Ship(document.createElement("div"), 1, "ship1"),
    new Ship(document.createElement("div"), 2, "ship2"),
    new Ship(document.createElement("div"), 3, "ship3"),
    new Ship(document.createElement("div"), 4, "ship4"),
    new Ship(document.createElement("div"), 5, "ship5")];

let defenseFields = [];
let attackFields = [];

let lastHitX, lastHitY, firstHitX, firstHitY, lastHitShip, lastHitOrientation;

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
        console.log("attack board:", field);
    }
    for (let field of defenseFields) {
        console.log("defense board", field);
    }
    for (let ship of ownFleetOfShips) {
        console.log("base fleet board", ship);
    }
}

function initializeEnemyShips(){
    console.log("start initializing enemy ships");
    for (let ship of enemyFleetOfShips) {
        console.log("start initialized enemy ship: ", ship);
        let x = getRandomInt(10);
        let y = getRandomInt(10);
        let field = attackFields[x * 10 + y];
        console.log("try on field:", field);
        while (checkSpaces(ship, x, y, attackFields) == false) {
            x = getRandomInt(10);
            y = getRandomInt(10);
            field = attackFields[y * 10 + x];
        }
        console.log(field);
        placeShip(field, ship, attackFields, false);
        console.log("finished initialized ship: ", ship);
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

function getAttacked(){
    let x, y;
    do {
        x = getRandomInt(10);
        y = getRandomInt(10);
    }while (defenseFields[x * 10 + y].hit);
    if (lastHitShip != null && !lastHitShip.sunk){
        if (lastHitY + 1 < 10){
            if (attack(lastHitX, lastHitY + 1, defenseFields)){
                lastHitY = lastHitY + 1;
            }
        }else if (lastHitY - 1 >= 0){
            if (attack(lastHitY - 1, defenseFields)){
                lastHitY = lastHitY - 1;
            }
        }

    }else {
        console.log("get attacked on field:", x, y, defenseFields[x * 10 + y]);
        if (attack(x, y, defenseFields)){
            attackScore++;
            firstHitX = x;
            firstHitY = y;
            lastHitShip = defenseFields[x * 10 + y].ship;
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