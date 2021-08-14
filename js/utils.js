/**
 * Expand canvas to fill its parent and adjust the viewport size
 * @param {HTMLCanvasElement} canvas
 * @param {WebGL2RenderingContext} gl
 */
const expandCanvasToContainer = function (canvas, gl) {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
};

const mathUtils = {
  /**
   * Convert angle from degrees to radians
   * @param {number} angle
   * @returns {number}
   */
  degToRad: function (angle) {
    return (angle * Math.PI) / 180;
  },

  /**
   * Obtain 4D identity matrix
   * @returns {number[]} 4D matrix array
   */
  identityMatrix: function () {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  },

  /**
   * Obtain 3D identity matrix
   * @returns {number[]} 3D matrix array
   */
  identityMatrix3: function () {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  },

  /**
   * Obtain 3D matrix from a 4D one
   * @param {number[]} m 4D matrix
   * @returns {number[]} 3D matrix
   */
  sub3x3from4x4: function (m) {
    const out = [];
    out[0] = m[0];
    out[1] = m[1];
    out[2] = m[2];
    out[3] = m[4];
    out[4] = m[5];
    out[5] = m[6];
    out[6] = m[8];
    out[7] = m[9];
    out[8] = m[10];
    return out;
  },

  /**
   * Multiply a 3D matrix by a 3D vector
   * @param {number[]} m 3D matrix
   * @param {number[]} a 3D vector
   * @returns {number[]} m*a 3D vector
   */
  multiplyMatrix3Vector3: function (m, a) {
    const out = [];
    const x = a[0],
      y = a[1],
      z = a[2];
    out[0] = x * m[0] + y * m[1] + z * m[2];
    out[1] = x * m[3] + y * m[4] + z * m[5];
    out[2] = x * m[6] + y * m[7] + z * m[8];
    return out;
  },

  /**
   * Transpose a 3D matrix
   * @param {number[]} a original matrix
   * @returns {number[]} transposed matrix
   */
  transposeMatrix3: function (a) {
    const out = [];

    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];

    return out;
  },

  /**
   * Invert a 3D matrix
   * @param {number[]} m original matrix
   * @returns {null|number[]} inverted matrix
   */
  invertMatrix3: function (m) {
    const out = [];

    const a00 = m[0],
      a01 = m[1],
      a02 = m[2],
      a10 = m[3],
      a11 = m[4],
      a12 = m[5],
      a20 = m[6],
      a21 = m[7],
      a22 = m[8],
      b01 = a22 * a11 - a12 * a21,
      b11 = -a22 * a10 + a12 * a20,
      b21 = a21 * a10 - a11 * a20,
      // Calculate the determinant
      det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) {
      return null;
    }
    const detInverse = 1.0 / det;

    out[0] = b01 * detInverse;
    out[1] = (-a22 * a01 + a02 * a21) * detInverse;
    out[2] = (a12 * a01 - a02 * a11) * detInverse;
    out[3] = b11 * detInverse;
    out[4] = (a22 * a00 - a02 * a20) * detInverse;
    out[5] = (-a12 * a00 + a02 * a10) * detInverse;
    out[6] = b21 * detInverse;
    out[7] = (-a21 * a00 + a01 * a20) * detInverse;
    out[8] = (a11 * a00 - a01 * a10) * detInverse;

    return out;
  },

  /**
   * Invert a 4D matrix
   * @param {number[]} m original matrix
   * @returns {number[]} inverted matrix
   */
  invertMatrix: function (m) {
    const out = [];
    const inv = [];
    let det;

    inv[0] =
      m[5] * m[10] * m[15] -
      m[5] * m[11] * m[14] -
      m[9] * m[6] * m[15] +
      m[9] * m[7] * m[14] +
      m[13] * m[6] * m[11] -
      m[13] * m[7] * m[10];

    inv[4] =
      -m[4] * m[10] * m[15] +
      m[4] * m[11] * m[14] +
      m[8] * m[6] * m[15] -
      m[8] * m[7] * m[14] -
      m[12] * m[6] * m[11] +
      m[12] * m[7] * m[10];

    inv[8] =
      m[4] * m[9] * m[15] -
      m[4] * m[11] * m[13] -
      m[8] * m[5] * m[15] +
      m[8] * m[7] * m[13] +
      m[12] * m[5] * m[11] -
      m[12] * m[7] * m[9];

    inv[12] =
      -m[4] * m[9] * m[14] +
      m[4] * m[10] * m[13] +
      m[8] * m[5] * m[14] -
      m[8] * m[6] * m[13] -
      m[12] * m[5] * m[10] +
      m[12] * m[6] * m[9];

    inv[1] =
      -m[1] * m[10] * m[15] +
      m[1] * m[11] * m[14] +
      m[9] * m[2] * m[15] -
      m[9] * m[3] * m[14] -
      m[13] * m[2] * m[11] +
      m[13] * m[3] * m[10];

    inv[5] =
      m[0] * m[10] * m[15] -
      m[0] * m[11] * m[14] -
      m[8] * m[2] * m[15] +
      m[8] * m[3] * m[14] +
      m[12] * m[2] * m[11] -
      m[12] * m[3] * m[10];

    inv[9] =
      -m[0] * m[9] * m[15] +
      m[0] * m[11] * m[13] +
      m[8] * m[1] * m[15] -
      m[8] * m[3] * m[13] -
      m[12] * m[1] * m[11] +
      m[12] * m[3] * m[9];

    inv[13] =
      m[0] * m[9] * m[14] -
      m[0] * m[10] * m[13] -
      m[8] * m[1] * m[14] +
      m[8] * m[2] * m[13] +
      m[12] * m[1] * m[10] -
      m[12] * m[2] * m[9];

    inv[2] =
      m[1] * m[6] * m[15] -
      m[1] * m[7] * m[14] -
      m[5] * m[2] * m[15] +
      m[5] * m[3] * m[14] +
      m[13] * m[2] * m[7] -
      m[13] * m[3] * m[6];

    inv[6] =
      -m[0] * m[6] * m[15] +
      m[0] * m[7] * m[14] +
      m[4] * m[2] * m[15] -
      m[4] * m[3] * m[14] -
      m[12] * m[2] * m[7] +
      m[12] * m[3] * m[6];

    inv[10] =
      m[0] * m[5] * m[15] -
      m[0] * m[7] * m[13] -
      m[4] * m[1] * m[15] +
      m[4] * m[3] * m[13] +
      m[12] * m[1] * m[7] -
      m[12] * m[3] * m[5];

    inv[14] =
      -m[0] * m[5] * m[14] +
      m[0] * m[6] * m[13] +
      m[4] * m[1] * m[14] -
      m[4] * m[2] * m[13] -
      m[12] * m[1] * m[6] +
      m[12] * m[2] * m[5];

    inv[3] =
      -m[1] * m[6] * m[11] +
      m[1] * m[7] * m[10] +
      m[5] * m[2] * m[11] -
      m[5] * m[3] * m[10] -
      m[9] * m[2] * m[7] +
      m[9] * m[3] * m[6];

    inv[7] =
      m[0] * m[6] * m[11] -
      m[0] * m[7] * m[10] -
      m[4] * m[2] * m[11] +
      m[4] * m[3] * m[10] +
      m[8] * m[2] * m[7] -
      m[8] * m[3] * m[6];

    inv[11] =
      -m[0] * m[5] * m[11] +
      m[0] * m[7] * m[9] +
      m[4] * m[1] * m[11] -
      m[4] * m[3] * m[9] -
      m[8] * m[1] * m[7] +
      m[8] * m[3] * m[5];

    inv[15] =
      m[0] * m[5] * m[10] -
      m[0] * m[6] * m[9] -
      m[4] * m[1] * m[10] +
      m[4] * m[2] * m[9] +
      m[8] * m[1] * m[6] -
      m[8] * m[2] * m[5];

    det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

    if (det === 0) return this.identityMatrix();

    const detInverse = 1.0 / det;

    for (let i = 0; i < 16; i++) {
      out[i] = inv[i] * detInverse;
    }

    return out;
  },

  /**
   * Transpose a 4D matrix
   * @param {number[]} m original matrix
   * @returns {number[]} transposed matrix
   */
  transposeMatrix: function (m) {
    const out = [];

    let row, column, row_offset;

    row_offset = 0;
    for (row = 0; row < 4; ++row) {
      row_offset = row * 4;
      for (column = 0; column < 4; ++column) {
        out[row_offset + column] = m[row + column * 4];
      }
    }
    return out;
  },

  /**
   * Multiply two 4D matrices
   * @param {number[]} m1 left matrix
   * @param {number[]} m2 right matrix
   * @returns {number[]} m1*m2 4D matrix
   */
  multiplyMatrices: function (m1, m2) {
    const out = [];

    let row, column, row_offset;

    row_offset = 0;
    for (row = 0; row < 4; ++row) {
      row_offset = row * 4;
      for (column = 0; column < 4; ++column) {
        out[row_offset + column] =
          m1[row_offset + 0] * m2[column + 0] +
          m1[row_offset + 1] * m2[column + 4] +
          m1[row_offset + 2] * m2[column + 8] +
          m1[row_offset + 3] * m2[column + 12];
      }
    }
    return out;
  },

  /**
   * Multiply a 4D matrix by a 4D vector
   * @param {number[]} m 4D matrix
   * @param {number[]} v 4D vector
   * @returns {number[]} m*v 4D vector
   */
  multiplyMatrixVector: function (m, v) {
    const out = [];

    let row, row_offset;

    row_offset = 0;
    for (row = 0; row < 4; ++row) {
      row_offset = row * 4;

      out[row] =
        m[row_offset + 0] * v[0] +
        m[row_offset + 1] * v[1] +
        m[row_offset + 2] * v[2] +
        m[row_offset + 3] * v[3];
    }
    return out;
  },
};

const transformUtils = {
  /**
   * Create a transform matrix for a translation of ({dx}, {dy}, {dz})
   * @param {number} dx x offset
   * @param {number} dy y offset
   * @param {number} dz z offset
   * @returns {number[]} 4D matrix of the translation
   */
  makeTranslateMatrix: function (dx, dy, dz) {
    const out = mathUtils.identityMatrix();

    out[3] = dx;
    out[7] = dy;
    out[11] = dz;

    return out;
  },

  /**
   * Create a transform matrix for a rotation of {a} degrees along the X axis
   * @param {number} a angle in degrees
   * @returns {number[]} 4D matrix of the rotation
   */
  makeRotateXMatrix: function (a) {
    const out = mathUtils.identityMatrix();

    const adeg = mathUtils.degToRad(a);
    const c = Math.cos(adeg);
    const s = Math.sin(adeg);

    out[5] = out[10] = c;
    out[6] = -s;
    out[9] = s;

    return out;
  },

  /**
   * Create a transform matrix for a rotation of {a} degrees along the Y axis
   * @param {number} a angle in degrees
   * @returns {number[]} 4D matrix of the rotation
   */
  makeRotateYMatrix: function (a) {
    const out = mathUtils.identityMatrix();

    const adeg = mathUtils.degToRad(a);

    const c = Math.cos(adeg);
    const s = Math.sin(adeg);

    out[0] = out[10] = c;
    out[2] = s;
    out[8] = -s;

    return out;
  },

  /**
   * Create a transform matrix for a rotation of {a} degrees along the Z axis
   * @param {number} a angle in degrees
   * @returns {number[]} 4D matrix of the rotation
   */
  makeRotateZMatrix: function (a) {
    const out = mathUtils.identityMatrix();

    const adeg = mathUtils.degToRad(a);
    const c = Math.cos(adeg);
    const s = Math.sin(adeg);

    out[0] = out[5] = c;
    out[4] = s;
    out[1] = -s;

    return out;
  },

  /**
   * Create a transform matrix for proportional scale
   * @param {number} s scale
   * @returns {number[]} 4D matrix of the scaling
   */
  makeScaleMatrix: function (s) {
    const out = mathUtils.identityMatrix();

    out[0] = out[5] = out[10] = s;

    return out;
  },

  /**
   * Create a scale matrix for a scale of ({sx}, {sy}, {sz})
   * @param sx scale along the x axis
   * @param sy scale along the y axis
   * @param sz scale along the z axis
   * @returns {number[]} 4D matrix of the scaling
   */
  makeScaleNuMatrix: function (sx, sy, sz) {
    const out = mathUtils.identityMatrix();

    out[0] = sx;
    out[5] = sy;
    out[10] = sz;

    return out;
  },

  /**
   * Create a shear matrix along the x axis
   * @param {number} hy bending along the y axis
   * @param {number} hz bending along the z axis
   * @returns {number[]} 4D matrix of the shearing
   */
  makeShearXMatrix: function (hy, hz) {
    const out = mathUtils.identityMatrix();

    out[4] = hy;
    out[8] = hz;

    return out;
  },

  /**
   * Create a shear matrix along the y axis
   * @param {number} hx bending along the x axis
   * @param {number} hz bending along the z axis
   * @returns {number[]} 4D matrix of the shearing
   */
  makeShearYMatrix: function (hx, hz) {
    const out = mathUtils.identityMatrix();

    out[1] = hx;
    out[9] = hz;

    return out;
  },

  /**
   * Create a shear matrix along the z axis
   * @param {number} hx bending along the x axis
   * @param {number} hy bending along the y axis
   * @returns {number[]} 4D matrix of the shearing
   */
  makeShearZMatrix: function (hx, hy) {
    const out = mathUtils.identityMatrix();

    out[2] = hx;
    out[6] = hy;

    return out;
  },
};

const projectionUtils = {
  /**
   * Creates a world matrix for an object
   * @param {number} tx translation along the x axis
   * @param {number} ty translation along the y axis
   * @param {number} tz translation along the z axis
   * @param {number} rx rotation along the x axis
   * @param {number} ry rotation along the y axis
   * @param {number} rz rotation along the z axis
   * @param {number} s uniform scaling
   * @returns {number[]} 4D matrix of the world
   */
  makeWorld: function (tx, ty, tz, rx, ry, rz, s) {
    const Rx = transformUtils.makeRotateXMatrix(rx);
    const Ry = transformUtils.makeRotateYMatrix(ry);
    const Rz = transformUtils.makeRotateZMatrix(rz);
    const S = transformUtils.makeScaleMatrix(s);
    const T = transformUtils.makeTranslateMatrix(tx, ty, tz);

    let out = mathUtils.multiplyMatrices(Rz, S);
    out = mathUtils.multiplyMatrices(Ry, out);
    out = mathUtils.multiplyMatrices(Rx, out);
    out = mathUtils.multiplyMatrices(T, out);

    return out;
  },

  /**
   * Creates a view matrix. The camera is centered in ({cx}, {cy}, {cz}).
   * It looks {ang} degrees on y axis, and {elev} degrees on the x axis.
   * @param {number} cx camera x position
   * @param {number} cy camera y position
   * @param {number} cz camera z position
   * @param {number} elev elevation angle in degrees
   * @param {number} ang azimuth angle in degrees
   * @returns {number[]} 4D matrix of the view
   */
  makeView: function (cx, cy, cz, elev, ang) {
    const T = transformUtils.makeTranslateMatrix(-cx, -cy, -cz);
    const Rx = transformUtils.makeRotateXMatrix(-elev);
    const Ry = transformUtils.makeRotateYMatrix(-ang);

    const tmp = mathUtils.multiplyMatrices(Ry, T);
    const out = mathUtils.multiplyMatrices(Rx, tmp);

    return out;
  },

  /**
   * Creates the perspective projection matrix
   * @param {number} fovy vertical field-of-view in degrees
   * @param {number} a aspect ratio
   * @param {number} n distance of the near plane
   * @param {number} f distance of the far plane
   * @returns {number[]} 4D matrix of the perspective
   */
  makePerspective: function (fovy, a, n, f) {
    const perspective = mathUtils.identityMatrix();

    const halfFovyRad = mathUtils.degToRad(fovy / 2); // stores {fovy/2} in radiants
    const ct = 1.0 / Math.tan(halfFovyRad); // cotangent of {fov/2}

    perspective[0] = ct / a;
    perspective[5] = ct;
    perspective[10] = (f + n) / (n - f);
    perspective[11] = (2.0 * f * n) / (n - f);
    perspective[14] = -1.0;
    perspective[15] = 0.0;

    return perspective;
  },
};

/**
 * Fetch file from url
 * @param {string} url
 * @returns {null|Promise<string>}
 */
const fetchFile = async function (url) {
  const response = await fetch(url);
  if (!response.ok) {
    alert(`Network response was not ok. Cannot fetch resource at ${url}`);
    return null;
  }
  const text = await response.text();
  return text;
};

const shaderUtils = {
  /**
   * Compile shaders and create program
   * @param {WebGL2RenderingContext} gl
   * @param {string[]} shaderText array with sources of vertex shader and fragment shader
   * @returns {*|WebGLProgram}
   */
  createAndCompileShaders: function (gl, shaderText) {
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
    const fragmentShader = this.createShader(
      gl,
      gl.FRAGMENT_SHADER,
      shaderText[1]
    );

    const program = this.createProgram(gl, vertexShader, fragmentShader);

    return program;
  },

  /**
   * Create shader from source text
   * @param {WebGL2RenderingContext} gl
   * @param {GLenum} type fragment or vertex
   * @param {string} source
   * @returns {WebGLShader}
   */
  createShader: function (gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    } else {
      if (type === gl.VERTEX_SHADER) {
        alert("ERROR IN VERTEX SHADER : " + gl.getShaderInfoLog(shader));
      }
      if (type === gl.FRAGMENT_SHADER) {
        alert("ERROR IN FRAGMENT SHADER : " + gl.getShaderInfoLog(shader));
      }
      gl.deleteShader(shader);
      throw "could not compile shader:" + gl.getShaderInfoLog(shader);
    }
  },

  /**
   * Link program from provided shaders
   * @param {WebGL2RenderingContext} gl
   * @param {WebGLShader} vertexShader
   * @param {WebGLShader} fragmentShader
   * @returns {WebGLProgram|null}
   */
  createProgram: function (gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    } else {
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      throw `Program failed to link: ${gl.getProgramInfoLog(program)}`;
    }
  },
};

export {
  expandCanvasToContainer,
  mathUtils,
  transformUtils,
  projectionUtils,
  fetchFile,
  shaderUtils,
};
