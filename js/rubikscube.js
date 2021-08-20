import { mathUtils, fetchFile, transformUtils } from "./utils.js";
import "./webgl-obj-loader.min.js";

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
  }
}

/**
 * Initialize every piece of the cube
 * @param {string} assetDir
 * @return {Promise<*[]>}
 */
async function initializePieces(assetDir) {
  let pieceArray = [];

  // Fetch meshes in parallel and process them when they are all ready
  let promises = [...Array(26).keys()].map((id) =>
    fetchFile(`${assetDir}piece${id}.obj`)
  );
  let meshObjStrings = await Promise.all(promises);

  // qui importo gli obj, per ogni obj faccio un oggetto Piece
  // dentro ogni Piece memorizzo vertici, normali, indici e uv
  for (let id = 0; id < 26; id++) {
    let meshObjStr = meshObjStrings[id];
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
  //console.log(pieceArray);
  return pieceArray;
}

class Slot {
  constructor(id, piece) {
    this.id = id;
    this.piece = piece;
  }
}

function initializeSlots(pieceArray) {
  let slotArray = [];
  for (let i = 0; i < 26; i++) {
    slotArray.push(new Slot(i, pieceArray[i]));
  }
  //console.log(slotArray);
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
  constructor(name, slotsID, slotArray, cwMatrix, ccwMatrix) {
    this.name = name;
    this.slots = slotsID.map((x) => slotArray[x]);
    this.cwMatrix = cwMatrix;
    this.ccwMatrix = ccwMatrix;
    //console.log(this.slots);
  }
  turn(clockwise) {
    if (clockwise) {
      for (let i = 0; i < this.slots.length; i++) {
        this.slots[i].piece.worldMatrix = mathUtils.multiplyMatrices(
          this.cwMatrix,
          this.slots[i].piece.worldMatrix
        );
      }
      let tempC = this.slots[6].piece;
      let tempE = this.slots[7].piece;
      this.slots[6].piece = this.slots[4].piece;
      this.slots[4].piece = this.slots[2].piece; //in 25 l'8
      this.slots[2].piece = this.slots[0].piece; // in 8 il 6
      this.slots[0].piece = tempC;
      this.slots[7].piece = this.slots[5].piece;
      this.slots[5].piece = this.slots[3].piece;
      this.slots[3].piece = this.slots[1].piece;
      this.slots[1].piece = tempE;
    } else {
      for (let i = 0; i < this.slots.length; i++) {
        this.slots[i].piece.worldMatrix = mathUtils.multiplyMatrices(
          this.ccwMatrix,
          this.slots[i].piece.worldMatrix
        );
      }
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
}

function initializeFaces(slotArray) {
  let faces = {};
  faces["U"] = new Face(
    "up",
    [0, 1, 2, 5, 8, 7, 6, 3, 4],
    slotArray,
    transformUtils.makeRotateYMatrix(-90),
    transformUtils.makeRotateYMatrix(90)
  );
  faces["D"] = new Face(
    "down",
    [23, 24, 25, 22, 19, 18, 17, 20, 21],
    slotArray,
    transformUtils.makeRotateYMatrix(90),
    transformUtils.makeRotateYMatrix(-90)
  );
  faces["L"] = new Face(
    "left",
    [0, 3, 6, 14, 23, 20, 17, 9, 12],
    slotArray,
    transformUtils.makeRotateXMatrix(-90),
    transformUtils.makeRotateXMatrix(90)
  );
  faces["R"] = new Face(
    "right",
    [8, 5, 2, 11, 19, 22, 25, 16, 13],
    slotArray,
    transformUtils.makeRotateXMatrix(-90),
    transformUtils.makeRotateXMatrix(90)
  );
  faces["F"] = new Face(
    "front",
    [6, 7, 8, 16, 25, 24, 23, 14, 15],
    slotArray,
    transformUtils.makeRotateZMatrix(-90),
    transformUtils.makeRotateZMatrix(90)
  );
  faces["B"] = new Face(
    "back",
    [2, 1, 0, 9, 17, 18, 19, 11, 10],
    slotArray,
    transformUtils.makeRotateZMatrix(90),
    transformUtils.makeRotateZMatrix(-90)
  );
  faces["M"] = new Face(
    "middle",
    [1, 4, 7, 15, 24, 21, 18, 10],
    slotArray,
    transformUtils.makeRotateXMatrix(-90),
    transformUtils.makeRotateXMatrix(90)
  );
  faces["E"] = new Face(
    "equatorial",
    [14, 15, 16, 13, 11, 10, 9, 12],
    slotArray,
    transformUtils.makeRotateYMatrix(90),
    transformUtils.makeRotateYMatrix(-90)
  );
  faces["S"] = new Face(
    "standing",
    [3, 4, 5, 13, 22, 21, 20, 12],
    slotArray,
    transformUtils.makeRotateZMatrix(-90),
    transformUtils.makeRotateZMatrix(90)
  );
  return faces;
}

// magari fai un dict e poi lo piazzi in un oggetto RubiksCube o OurCube o CubeGraph
// poi puoi esportare sta classe CubeGraph che ha tipo un metodo makeCompleteTurn, makeDeltaTurn (per il trascinamento)
// complete turn va fatta quando l'animazione è completata e serve a cambiare il scene graph
// delta turn va fatta durante il trascinamento, è quella che cambia effettivamente la world matrix dei cubetti di quella faccia
//    questa world matrix andrà settata come uniform per renderizzare subito il cambiamento

class RubiksCube {
  constructor() {
    this.pieceArray = null;
    this.slotArray = null;
    this.faces = null;
    this.cube = new Cube();

    // console.log(this.cube.asString());
    // console.log(this.cube.isSolved());
    // this.cube.move("L M R'");
    // console.log("moved");
    // console.log(this.cube.asString());
    // console.log(this.cube.isSolved());

    //Cube.initSolver();
    // let algo = cube.solve();
    // console.log(algo);
    // cube.move(algo);
    // console.log(cube.asString());
  }
  isSolved() {
    return this.cube.isSolved();
  }
  move(faceName, clockwise) {
    this.faces[faceName].turn(clockwise);
    let move = faceName + clockwise ? "" : "'";
    this.cube.move(move);
  }
}

/**
 * Initialize cube
 * @param {string} assetDir
 * @return {Promise<RubiksCube>}
 */
async function initializeCube(assetDir) {
  let rubiksCube = new RubiksCube();
  rubiksCube.pieceArray = await initializePieces(assetDir);
  rubiksCube.slotArray = initializeSlots(rubiksCube.pieceArray);
  rubiksCube.faces = initializeFaces(rubiksCube.slotArray);
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
