import { mathUtils, fetchFile, transformUtils } from "./utils.js";
import { generateScramble } from "./scramble.js";
import "./webgl-obj-loader.min.js";

const rotMatrixDict = {
  x: transformUtils.makeRotateXMatrix,
  y: transformUtils.makeRotateYMatrix,
  z: transformUtils.makeRotateZMatrix,
};

const coordDict = {
  x: 0,
  y: 1,
  z: 2,
};

class Piece {
  constructor(id, vertices, normals, indices, textures, tangents, bitangents) {
    this.id = id;
    this.vertices = vertices;
    this.normals = normals;
    this.indices = indices;
    this.textures = textures;
    this.tangents = tangents;
    this.bitangents = bitangents;
    this.worldMatrix = mathUtils.identityMatrix();
    this.vao = null;
    this.bounds = [];
  }
}

/**
 * Initialize every piece of the cube
 * @param {string} meshDir
 * @return {Promise<*[]>}
 */
async function initializePieces(meshDir) {
  let pieceArray = [];

  // Fetch meshes in parallel and sequentially process them as they are ready
  let promises = [...Array(26).keys()].map((id) =>
    fetchFile(`${meshDir}piece${id}.obj`)
  );

  // qui importo gli obj, per ogni obj faccio un oggetto Piece
  // dentro ogni Piece memorizzo vertici, normali, indici e uv
  for (let id = 0; id < 26; id++) {
    let meshObjStr = await promises[id];
    let meshObj = new OBJ.Mesh(meshObjStr);
    meshObj.calculateTangentsAndBitangents();
    pieceArray.push(
      new Piece(
        id,
        meshObj.vertices,
        meshObj.vertexNormals,
        meshObj.indices,
        meshObj.textures,
        meshObj.tangents,
        meshObj.bitangents
      )
    );
  }
  return pieceArray;
}

class Slot {
  constructor(id, piece) {
    this.id = id;
    this.piece = piece;
    this.faces = null;
  }
}

function initializeSlots(pieceArray) {
  let slotArray = [];
  for (let i = 0; i < 26; i++) {
    slotArray.push(new Slot(i, pieceArray[i]));
  }
  return slotArray;
}

class Face {
  /**
   * @param {string} name
   * @param {number[]} slotsID indices of slots contained in the face
   * @param {number[]} slotArray all the existing slots
   * @param {number[]} cwMatrix clockwise rotation 4D matrix
   * @param {number[]} ccwMatrix counter clockwise rotation 4D matrix
   */
  constructor(name, slotsID, slotArray, rotAxis, rotDir, fixedCoordinateValue) {
    this.name = name;
    this.slotsID = slotsID;
    this.slots = slotsID.map((x) => slotArray[x]);
    this.rotAxis = rotAxis;
    this.rotDir = rotDir;
    this.tempAngle = 0;
    this.fixedCoordinate = rotAxis;
    this.fixedCoordinateValue = fixedCoordinateValue;
    this.center = [0, 0, 0];
    this.center[this.fixedCoordinate] = fixedCoordinateValue;
  }
  turnABit(angle) {
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].piece.worldMatrix = mathUtils.multiplyMatrices(
        rotMatrixDict[this.rotAxis](this.rotDir * angle),
        this.slots[i].piece.worldMatrix
      );
    }
    this.tempAngle += angle;
  }

  turn(clockwise) {
    if (clockwise) {
      let tempC = this.slots[6].piece;
      let tempE = this.slots[7].piece;
      this.slots[6].piece = this.slots[4].piece;
      this.slots[4].piece = this.slots[2].piece;
      this.slots[2].piece = this.slots[0].piece;
      this.slots[0].piece = tempC;
      this.slots[7].piece = this.slots[5].piece;
      this.slots[5].piece = this.slots[3].piece;
      this.slots[3].piece = this.slots[1].piece;
      this.slots[1].piece = tempE;
    } else {
      let tempC = this.slots[0].piece;
      let tempE = this.slots[1].piece;
      this.slots[0].piece = this.slots[2].piece;
      this.slots[2].piece = this.slots[4].piece;
      this.slots[4].piece = this.slots[6].piece;
      this.slots[6].piece = tempC;
      this.slots[1].piece = this.slots[3].piece;
      this.slots[3].piece = this.slots[5].piece;
      this.slots[5].piece = this.slots[7].piece;
      this.slots[7].piece = tempE;
    }
  }

  intersectRay(rayStartPoint, normalisedRayDir) {
    let intersection = [];
    let fixedCoordinateNumber = coordDict[this.fixedCoordinate];

    if (normalisedRayDir[fixedCoordinateNumber] == 0) return null;

    let t =
      (this.fixedCoordinateValue - rayStartPoint[fixedCoordinateNumber]) /
      normalisedRayDir[fixedCoordinateNumber]; //geometric formula
    intersection[fixedCoordinateNumber] = this.fixedCoordinateValue;
    for (const [coord, number] of Object.entries(coordDict)) {
      if (coord != this.fixedCoordinate) {
        intersection[number] =
          rayStartPoint[number] + normalisedRayDir[number] * t; // geometric formula
      }
    }
    return intersection;
  }
}

function initializeFaces(slotArray) {
  let faces = {};
  faces["U"] = new Face(
    "U",
    [0, 1, 2, 5, 8, 7, 6, 3, 4],
    slotArray,
    "y",
    -1,
    3
  );
  faces["D"] = new Face(
    "D",
    [23, 24, 25, 22, 19, 18, 17, 20, 21],
    slotArray,
    "y",
    1,
    -3
  );
  faces["L"] = new Face(
    "L",
    [0, 3, 6, 14, 23, 20, 17, 9, 12],
    slotArray,
    "x",
    1,
    -3
  );
  faces["R"] = new Face(
    "R",
    [8, 5, 2, 11, 19, 22, 25, 16, 13],
    slotArray,
    "x",
    -1,
    3
  );
  faces["F"] = new Face(
    "F",
    [6, 7, 8, 16, 25, 24, 23, 14, 15],
    slotArray,
    "z",
    -1,
    3
  );
  faces["B"] = new Face(
    "B",
    [2, 1, 0, 9, 17, 18, 19, 11, 10],
    slotArray,
    "z",
    1,
    -3
  );
  faces["M"] = new Face(
    "M",
    [1, 4, 7, 15, 24, 21, 18, 10],
    slotArray,
    "x",
    1,
    0
  );
  faces["E"] = new Face(
    "E",
    [14, 15, 16, 13, 11, 10, 9, 12],
    slotArray,
    "y",
    1,
    0
  );
  faces["S"] = new Face(
    "S",
    [3, 4, 5, 13, 22, 21, 20, 12],
    slotArray,
    "z",
    -1,
    0
  );
  return faces;
}

class RubiksCube {
  constructor() {
    this.pieceArray = null;
    this.slotArray = null;
    this.faces = null;
    this.facelets = [];
    this.cube = new Cube();
    this.solvedInitialized = false;
  }
  isSolved() {
    return this.cube.isSolved();
  }
  move(faceName, clockwise) {
    this.faces[faceName].turn(clockwise);
    let move = faceName + clockwise ? "" : "'";
    this.cube.move(move);
  }
  turnFaceABit(faceName, angle) {
    this.faces[faceName].turnABit(angle);
  }

  /**
   * Rotate the given face with an animation, re-aligning it.
   * @param {string} faceName the name of the face to rotate
   * @param {number} anglePerMs the angle per ms to rotate (integer)
   * @param {number} angle optional angle to which rotate the face. Defaults to 0.
   * @returns {Promise<void>}
   */
  async moveWithAnimation(faceName, anglePerMs = 2, angle = 0) {
    // First, face must be rotated to the nearest position
    let face = this.faces[faceName];
    let tempAngle = (face.tempAngle = face.tempAngle % 360);
    let roundedRotationAngle = Math.round(tempAngle / 90) * 90 + angle;

    // Compute the difference to the rounderRotationAngle
    let difference = roundedRotationAngle - tempAngle;

    // Move the face an angle at a time
    let turningAngle = difference > 0 ? anglePerMs : -1 * anglePerMs;
    difference = Math.abs(difference);
    let integerDifference = Math.floor(difference);
    while (integerDifference >= anglePerMs) {
      face.turnABit(turningAngle);
      integerDifference -= anglePerMs;
      await new Promise((r) => setTimeout(r, 1));
    }
    // Complete the rotation with the remaining part
    face.turnABit(roundedRotationAngle - face.tempAngle);

    // Change the scene graph and cube state if needed
    if (roundedRotationAngle % 360 !== 0) {
      //cube state and scene graph must be changed
      let move = faceName;
      if (roundedRotationAngle === 90 || roundedRotationAngle === -270) {
        face.turn(true);
      } else if (
        roundedRotationAngle === 180 ||
        roundedRotationAngle === -180
      ) {
        face.turn(true);
        face.turn(true);
        move += "2";
      } else if (roundedRotationAngle === -90 || roundedRotationAngle === 270) {
        face.turn(false);
        move += "'";
      }
      this.cube.move(move);
    }

    face.tempAngle = 0;
  }

  setFacelets() {
    for (let s = 0; s < this.slotArray.length; s++) {
      for (const [faceName, faceObj] of Object.entries(
        this.slotArray[s].faces
      )) {
        if (!"MES".includes(faceName)) {
          let facelet = {};
          facelet.slot = this.slotArray[s];
          facelet.face = faceObj;
          facelet.faces = this.slotArray[s].faces;
          facelet.fixedCoordinate = faceObj.fixedCoordinate;
          facelet.fixedCoordinateValue = faceObj.fixedCoordinateValue;
          facelet.bounds = [];
          for (const [coord, number] of Object.entries(coordDict)) {
            if (coord != facelet.fixedCoordinate) {
              let min = this.pieceArray[s].bounds[number][0]; // just for now slots are the same as pieces, no move has been done
              let max = this.pieceArray[s].bounds[number][1];
              facelet.bounds[number] = [min, max];
            }
          }
          facelet.directions = {};

          this.facelets.push(facelet);
        }
      }
    }
  }

  setDirectionsToFacelets() {
    for (let f = 0; f < this.facelets.length; f++) {
      let facelet = this.facelets[f];
      for (const [faceName, faceObj] of Object.entries(facelet.faces)) {
        if (faceName != facelet.face.name) {
          let rotAxis = [0, 0, 0];
          rotAxis[coordDict[faceObj.rotAxis]] = faceObj.rotDir;
          let v1 = rotAxis;
          let v2 = [];
          let startV2 = faceObj.center;
          let endV2 = [];
          endV2[coordDict[facelet.face.fixedCoordinate]] =
            facelet.face.fixedCoordinateValue;
          for (const [coord, index] of Object.entries(coordDict)) {
            if (coord != facelet.face.fixedCoordinate) {
              endV2[index] = faceObj.center[index];
            }
          }
          v2 = mathUtils.subtractVectors3(endV2, startV2);
          let dir = mathUtils.normaliseVector3(mathUtils.crossProduct3(v1, v2)); //maybe normalize
          facelet.directions[faceName] = dir;
        }
      }
    }
  }

  intersectFacelets(rayStartPoint, normalisedRayDir) {
    //for every facelet get intersection and distance, returns nearest facelet or null
    let minDistance = null;
    let intersection = null;
    let intersectedFacelet = null;
    for (let f = 0; f < this.facelets.length; f++) {
      let facelet = this.facelets[f];
      let temp_intersection = [];
      let fixedCoordinateNumber = coordDict[facelet.fixedCoordinate];
      if (normalisedRayDir[fixedCoordinateNumber] == 0) continue;
      let t =
        (facelet.fixedCoordinateValue - rayStartPoint[fixedCoordinateNumber]) /
        normalisedRayDir[fixedCoordinateNumber]; //geometric formula
      temp_intersection[fixedCoordinateNumber] = facelet.fixedCoordinateValue;
      let withinBounds = true;
      for (const [coord, number] of Object.entries(coordDict)) {
        if (number != fixedCoordinateNumber) {
          temp_intersection[number] =
            rayStartPoint[number] + normalisedRayDir[number] * t; // geometric formula
          if (
            temp_intersection[number] < facelet.bounds[number][0] ||
            temp_intersection[number] > facelet.bounds[number][1]
          )
            withinBounds = false;
        }
      }
      if (withinBounds) {
        let distance = mathUtils.distance3(temp_intersection, rayStartPoint); // distance from camera
        if (
          minDistance == null ||
          (minDistance != null && distance < minDistance)
        ) {
          minDistance = distance;
          intersection = temp_intersection;
          intersectedFacelet = facelet;
        }
      }
    }
    return [intersectedFacelet, intersection];
  }

  setBoundsToPieces() {
    for (let p = 0; p < this.pieceArray.length; p++) {
      for (const [coord, number] of Object.entries(coordDict)) {
        let filteredVertices = this.pieceArray[p].vertices.filter(
          (element, index) => index % 3 == number
        );
        let min = Math.min.apply(null, filteredVertices);
        let max = Math.max.apply(null, filteredVertices);
        this.pieceArray[p].bounds.push([min, max]);
      }
    }
  }

  setFacesToSlots() {
    for (let i = 0; i < this.slotArray.length; i++) {
      let tempFaces = {};
      for (const [faceName, faceObj] of Object.entries(this.faces)) {
        if (faceObj.slotsID.includes(this.slotArray[i].id))
          tempFaces[faceName] = faceObj;
      }
      this.slotArray[i].faces = tempFaces;
    }
  }

  /**
   * Execute the list of moves on the cube
   * @param {string[]} moves
   * @param {number} anglePerMs angle moved per ms in the animation
   */
  async executeMoves(moves, anglePerMs) {
    const charsToDegree = {
      "": 90,
      "'": -90,
      2: 180,
    };

    for (let move of moves) {
      let face = move.charAt(0);
      let angle = charsToDegree[move.charAt(1)];
      await this.moveWithAnimation(face, anglePerMs, angle);
    }
  }

  async scramble() {
    // Random between 20 and 25
    let numMoves = Math.floor(Math.random() * 5) + 20;
    let scrambleMoves = generateScramble(numMoves);

    await this.executeMoves(scrambleMoves, 5);
  }

  async solve() {
    if (!this.solvedInitialized) {
      Cube.initSolver();
      this.solvedInitialized = true;
    }

    let solution = this.cube.solve().split(" ");
    await this.executeMoves(solution, 1);
  }
}

/**
 * Initialize cube
 * @param {string} meshDir
 * @return {Promise<RubiksCube>}
 */
async function initializeCube(meshDir) {
  let rubiksCube = new RubiksCube();
  rubiksCube.pieceArray = await initializePieces(meshDir);
  rubiksCube.slotArray = initializeSlots(rubiksCube.pieceArray);
  rubiksCube.faces = initializeFaces(rubiksCube.slotArray);
  rubiksCube.setBoundsToPieces();
  rubiksCube.setFacesToSlots();
  rubiksCube.setFacelets();
  rubiksCube.setDirectionsToFacelets();
  return rubiksCube;
}

export { initializeCube, RubiksCube };
/*
    esempio:

                          U

                 L        F        R       B
                 
                          D


                       0  1  2
                       3  4  5
                       6  7  8
              0  3  6  6  7  8   8  5  2  2  1  0
              9  12 14 14 15 16 16 13 11 11 10  9
              17 20 23 23 24 25 25 22 19 19 18 17
                       23 24 25
                       20 21 22
                       17 18 19
    

    nelle slice il cubetto centrale nel quadrato 3x3 non esiste proprio, non lo considero (non deve ruotare con una matrice)
    nelle altre facce però deve ruotare coerentemente con gli altri cubetti della stessa faccia
        però comunque essendo il cubo che sta sull'asse di rotazione rimane nello stesso slot
        
*/
